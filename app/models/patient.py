from datetime import datetime
from sqlalchemy import Column, Float, Integer, String, Numeric, TIMESTAMP, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), index=True)
    age = Column(Integer)
    weight = Column(Numeric(5, 2))
    height = Column(Numeric(5, 2))
    goal = Column(String(255))
    gender = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="patients")
    diets = relationship("Diet", back_populates="patient", cascade="all, delete-orphan")
    checkins = relationship(
        "PatientCheckin",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


class PatientCheckin(Base):
    __tablename__ = "patient_checkins"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    weight = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="checkins")
