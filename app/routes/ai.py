from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.patient import Patient, PatientCheckin
from app.models.user import User
from app.schemas.ai import AIDietRequest, AIDietResponse, MacroBreakdown
from app.services.security import get_current_user
from app.services.nutrition_ai import generate_and_save_diet
from app.services.clinical_math import calcular_macros

router = APIRouter(prefix="/ai", tags=["Inteligência Artificial"])


@router.post("/generate-diet", response_model=AIDietResponse, status_code=status.HTTP_201_CREATED)
async def generate_diet_with_ai(
    payload: AIDietRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == payload.patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    recent_checkins = (
        db.query(PatientCheckin)
        .filter(PatientCheckin.patient_id == patient.id)
        .order_by(PatientCheckin.created_at.desc())
        .limit(3)
        .all()
    )

    diet, target, warnings, strategy, clinical_insights = await generate_and_save_diet(
        db, patient, payload, recent_checkins
    )

    macros_dict = calcular_macros(float(patient.weight or 70), target)

    return AIDietResponse(
        diet=diet,
        target_calories=target,
        estimated_calories=diet.total_calories,
        strategy=strategy,
        macros=MacroBreakdown(**macros_dict),
        warnings=warnings,
        clinical_insights=clinical_insights,
    )
