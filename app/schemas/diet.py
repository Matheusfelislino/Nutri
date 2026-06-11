from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- FOOD ITEMS ---
class FoodItemBase(BaseModel):
    name: str
    quantity: str
    calories: int

class FoodItemCreate(FoodItemBase):
    pass

class FoodItem(FoodItemBase):
    id: int
    meal_id: int

    class Config:
        from_attributes = True # Se usar Pydantic v2 (ou orm_mode = True no v1)

# --- MEALS ---
class MealBase(BaseModel):
    title: str
    time: str
    total_calories: int

class MealCreate(MealBase):
    foods: List[FoodItemCreate]

class Meal(MealBase):
    id: int
    diet_id: int
    foods: List[FoodItem]

    class Config:
        from_attributes = True

# --- DIET ---
class DietBase(BaseModel):
    total_calories: int

class DietCreate(DietBase):
    patient_id: int
    meals: List[MealCreate]

class Diet(DietBase):
    id: int
    patient_id: int
    created_at: datetime
    meals: List[Meal]

    class Config:
        from_attributes = True