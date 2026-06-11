from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database.connection import get_db
from app.models.diet import Diet, FoodItem, Meal
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diet import DietCreate, Diet as DietSchema
from app.services.security import get_current_user

router = APIRouter(prefix="/diets", tags=["Dietas"])


@router.get("/", response_model=List[DietSchema])
def get_diets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Diet)
        .join(Patient, Diet.patient_id == Patient.id)
        .options(joinedload(Diet.meals).joinedload(Meal.foods))
        .filter(Patient.user_id == current_user.id)
        .order_by(Diet.created_at.desc())
        .all()
    )


@router.post("/", response_model=DietSchema, status_code=status.HTTP_201_CREATED)
def create_diet(
    diet: DietCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == diet.patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    db_diet = Diet(patient_id=diet.patient_id, total_calories=diet.total_calories)
    db.add(db_diet)
    db.flush()

    for meal_data in diet.meals:
        db_meal = Meal(
            diet_id=db_diet.id,
            title=meal_data.title,
            time=meal_data.time,
            total_calories=meal_data.total_calories,
        )
        db.add(db_meal)
        db.flush()

        for food_data in meal_data.foods:
            db.add(
                FoodItem(
                    meal_id=db_meal.id,
                    name=food_data.name,
                    quantity=food_data.quantity,
                    calories=food_data.calories,
                )
            )

    db.commit()
    db.refresh(db_diet)
    return db_diet


@router.get("/patient/{patient_id}/", response_model=List[DietSchema])
def get_diets_by_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.user_id == current_user.id,
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado")

    return (
        db.query(Diet)
        .options(joinedload(Diet.meals).joinedload(Meal.foods))
        .filter(Diet.patient_id == patient_id)
        .order_by(Diet.created_at.desc())
        .all()
    )
