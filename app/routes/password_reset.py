import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.services.security import hash_password

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Autenticação"])

TOKEN_EXPIRY_MINUTES = 15


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    # Resposta genérica para não revelar se o e-mail existe (anti-enumeration)
    generic_response = {
        "message": "Se este e-mail estiver cadastrado, você receberá as instruções de recuperação."
    }

    if not user:
        return generic_response

    # Invalida tokens anteriores pendentes para este e-mail
    db.query(PasswordResetToken).filter(
        PasswordResetToken.email == body.email,
        PasswordResetToken.used == False,
    ).update({"used": True})

    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_MINUTES)

    db.add(PasswordResetToken(token=token, email=body.email, expires_at=expires_at))
    db.commit()

    reset_link = f"http://localhost:3000/reset-password?token={token}"
    logger.warning(
        "\n%s\n"
        "🔐  RESET DE SENHA  [MOCK — substituir por envio de e-mail real]\n"
        "E-mail : %s\n"
        "Link   : %s\n"
        "Expira : %s min\n"
        "%s",
        "=" * 60,
        body.email,
        reset_link,
        TOKEN_EXPIRY_MINUTES,
        "=" * 60,
    )

    return generic_response


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == body.token,
        PasswordResetToken.used == False,
    ).first()

    if not db_token:
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado")

    if datetime.utcnow() > db_token.expires_at:
        raise HTTPException(
            status_code=400,
            detail="Token expirado. Solicite uma nova recuperação de senha.",
        )

    user = db.query(User).filter(User.email == db_token.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")

    user.password_hash = hash_password(body.new_password)
    db_token.used = True
    db.commit()

    return {"message": "Senha redefinida com sucesso"}
