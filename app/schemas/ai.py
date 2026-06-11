from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas.diet import Diet


class AIRestrictionFlags(BaseModel):
    lactose: bool = False
    gluten: bool = False
    amendoim: bool = False
    vegetariano: bool = False
    vegano: bool = False


class AIDietRequest(BaseModel):
    patient_id: int
    activity_level: str = Field(default="moderado")
    restrictions: AIRestrictionFlags = Field(default_factory=AIRestrictionFlags)
    other_restrictions: Optional[str] = ""
    meals_per_day: int = Field(default=5, ge=3, le=6)
    calorie_target: Optional[int] = Field(default=None, ge=900, le=6000)
    professional_notes: Optional[str] = ""


class MacroBreakdown(BaseModel):
    proteina_g: float
    carboidrato_g: float
    gordura_g: float
    proteina_kcal: int
    carboidrato_kcal: int
    gordura_kcal: int
    fibra_g: float = 0.0


class AIDietResponse(BaseModel):
    diet: Diet
    target_calories: int
    estimated_calories: int
    strategy: str
    macros: MacroBreakdown
    warnings: List[str] = []
    clinical_insights: List[str] = []
