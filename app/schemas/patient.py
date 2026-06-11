from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class PatientBase(BaseModel):
    name: str
    email: EmailStr
    age: int
    weight: float
    height: float
    goal: str
    gender: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientNotesUpdate(BaseModel):
    notes: str


class PatientResponse(PatientBase):
    id: int
    created_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class PatientCheckinCreate(BaseModel):
    weight: float
    notes: Optional[str] = None


class PatientCheckinResponse(BaseModel):
    id: int
    patient_id: int
    weight: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
