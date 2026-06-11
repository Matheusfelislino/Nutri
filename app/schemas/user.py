from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("A senha deve conter pelo menos um número")
        return v
    age: int | None = None
    weight: float | None = None
    height: float | None = None
    daily_calorie_goal: int | None = None
    daily_water_goal_ml: int | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: int | None = None
    weight: float | None = None
    height: float | None = None
    daily_calorie_goal: int | None = None
    daily_water_goal_ml: int | None = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str