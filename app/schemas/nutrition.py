from pydantic import BaseModel
from typing import Optional


class NutritionFoodBase(BaseModel):
    name: str
    group: str
    portion: str
    calories: int
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    meal_tags: str = ""
    goal_tags: str = ""
    restriction_tags: str = ""
    notes: Optional[str] = None
    active: bool = True


class NutritionFoodCreate(NutritionFoodBase):
    pass


class NutritionFood(NutritionFoodBase):
    id: int

    class Config:
        from_attributes = True
