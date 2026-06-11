from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP
from sqlalchemy.orm import relationship # <-- IMPORTANTE ADICIONAR ISSO
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    age = Column(Integer)
    weight = Column(Numeric(5, 2))
    height = Column(Numeric(5, 2))
    daily_calorie_goal = Column(Integer)
    daily_water_goal_ml = Column(Integer)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    
    patients = relationship("Patient", back_populates="owner")