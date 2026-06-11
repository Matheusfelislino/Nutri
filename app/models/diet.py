from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # Mais seguro para datas no servidor
from app.database.connection import Base

class Diet(Base):
    __tablename__ = "diets"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Adicionamos este campo para salvar o caminho/link do PDF gerado
    pdf_url = Column(String, nullable=True) 
    
    # Usando func.now() para que o banco de dados cuide da data de criação
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    total_calories = Column(Integer, default=0)

    # Relações
    patient = relationship("Patient", back_populates="diets")
    meals = relationship("Meal", back_populates="diet", cascade="all, delete-orphan")

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    diet_id = Column(Integer, ForeignKey("diets.id"))
    title = Column(String) 
    time = Column(String)  
    total_calories = Column(Integer, default=0)

    # Relações
    diet = relationship("Diet", back_populates="meals")
    foods = relationship("FoodItem", back_populates="meal", cascade="all, delete-orphan")

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"))
    name = Column(String)      
    quantity = Column(String)  
    calories = Column(Integer) 

    # Relações
    meal = relationship("Meal", back_populates="foods")