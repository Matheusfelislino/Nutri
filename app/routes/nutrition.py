from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.nutrition import NutritionFood
from app.models.user import User
from app.schemas.nutrition import NutritionFood as NutritionFoodSchema, NutritionFoodCreate
from app.services.security import get_current_user

router = APIRouter(prefix="/nutrition-foods", tags=["Base Nutricional"])


@router.get("/", response_model=list[NutritionFoodSchema])
def list_foods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(NutritionFood).order_by(NutritionFood.group, NutritionFood.name).all()


@router.post("/", response_model=NutritionFoodSchema, status_code=status.HTTP_201_CREATED)
def create_food(
    food: NutritionFoodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(NutritionFood).filter(NutritionFood.name == food.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Alimento já cadastrado")

    db_food = NutritionFood(**food.dict())
    db.add(db_food)
    db.commit()
    db.refresh(db_food)
    return db_food
