from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.patient import Patient, PatientCheckin
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientNotesUpdate,
    PatientCheckinCreate,
    PatientCheckinResponse,
)
from app.services.security import get_current_user

router = APIRouter(prefix="/patients", tags=["Pacientes"])


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Patient).filter(
        Patient.email == patient.email,
        Patient.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um paciente com este email")

    db_patient = Patient(**patient.dict(), user_id=current_user.id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@router.get("/", response_model=list[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Patient).filter(Patient.user_id == current_user.id).order_by(Patient.id.asc()).all()


@router.get("/{patient_id}/", response_model=PatientResponse)
def get_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return db_patient


@router.put("/{patient_id}/", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    duplicated_email = db.query(Patient).filter(
        Patient.email == patient.email,
        Patient.user_id == current_user.id,
        Patient.id != patient_id,
    ).first()
    if duplicated_email:
        raise HTTPException(status_code=400, detail="Já existe outro paciente com este email")

    for field, value in patient.dict().items():
        setattr(db_patient, field, value)

    db.commit()
    db.refresh(db_patient)
    return db_patient


@router.patch("/{patient_id}/notes", response_model=dict)
def update_patient_notes(
    patient_id: int,
    body: PatientNotesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not db_patient:
        raise HTTPException(
            status_code=404,
            detail="Paciente não encontrado ou acesso negado"
        )

    db_patient.notes = body.notes
    db.commit()
    return {"ok": True}


@router.post(
    "/{patient_id}/checkins",
    response_model=PatientCheckinResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_checkin(
    patient_id: int,
    body: PatientCheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    checkin = PatientCheckin(patient_id=patient_id, **body.dict())
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/{patient_id}/checkins", response_model=list[PatientCheckinResponse])
def list_checkins(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    return (
        db.query(PatientCheckin)
        .filter(PatientCheckin.patient_id == patient_id)
        .order_by(PatientCheckin.created_at.desc())
        .all()
    )


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    db.delete(db_patient)
    db.commit()
    return {"message": "Paciente excluído com sucesso"}
