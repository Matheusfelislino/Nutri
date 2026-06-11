from datetime import datetime
from sqlalchemy import Column, String, Boolean, TIMESTAMP
from app.database.connection import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token = Column(String(64), primary_key=True)
    email = Column(String(150), nullable=False, index=True)
    expires_at = Column(TIMESTAMP, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
