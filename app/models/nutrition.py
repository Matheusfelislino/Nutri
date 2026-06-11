from sqlalchemy import Boolean, Column, Float, Integer, String, Text

from app.database.connection import Base


class NutritionFood(Base):
    __tablename__ = "nutrition_foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True, index=True)
    group = Column(String(80), nullable=False, index=True)
    portion = Column(String(80), nullable=False)
    calories = Column(Integer, nullable=False)
    protein_g = Column(Float, default=0)
    carbs_g = Column(Float, default=0)
    fat_g = Column(Float, default=0)
    fiber_g = Column(Float, default=0)
    meal_tags = Column(String(255), default="")
    goal_tags = Column(String(255), default="")
    restriction_tags = Column(String(255), default="")
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
