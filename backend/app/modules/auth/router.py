import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.email import send_email
from app.core.config import settings
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserLogin,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        logger.warning("Kayıt denemesi başarısız: %s zaten kayıtlı.", payload.email)
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    user = User(email=payload.email, hashed_password=service.hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Yeni kullanıcı kaydoldu: id=%s email=%s", user.id, user.email)

    token = service.create_access_token(subject=str(user.id))
    return Token(access_token=token)


@router.post("/google", response_model=Token)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    email = service.verify_google_token(payload.credential)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, hashed_password=None)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Google ile yeni kullanıcı oluşturuldu: id=%s email=%s", user.id, user.email)
    else:
        logger.info("Google ile giriş yapıldı: id=%s email=%s", user.id, user.email)

    token = service.create_access_token(subject=str(user.id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not service.verify_password(payload.password, user.hashed_password):
        logger.warning("Başarısız giriş denemesi: %s", payload.email)
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")

    logger.info("Giriş yapıldı: id=%s email=%s", user.id, user.email)
    token = service.create_access_token(subject=str(user.id))
    return Token(access_token=token)


def _send_reset_email(to_email: str, reset_link: str) -> None:
    """Arka planda calisir: SMTP yavas/takili olsa bile kullanicinin istegini
    bloklamaz. Hata olursa loglanir, kullaniciya yansimaz."""
    body = (
        "Merhaba,\n\n"
        "Akıllı Portföy hesabının şifresini sıfırlamak için aşağıdaki bağlantıya tıkla "
        "(bağlantı 15 dakika geçerlidir):\n\n"
        f"{reset_link}\n\n"
        "Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin, şifren değişmez.\n\n"
        "Akıllı Portföy"
    )
    try:
        send_email(to_email, "Akıllı Portföy - Şifre Sıfırlama", body)
        logger.info("Şifre sıfırlama e-postası gönderildi: %s", to_email)
    except Exception:
        logger.exception("Şifre sıfırlama e-postası gönderilemedi: %s", to_email)


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = service.create_reset_token(subject=str(user.id))
        reset_link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
        # E-posta gonderimi arka planda: endpoint aninda doner, sayfa donmaz.
        background_tasks.add_task(_send_reset_email, user.email, reset_link)

    # Guvenlik: e-posta kayitli olsun olmasin ayni cevap donulur; boylece
    # hangi e-postalarin kayitli oldugu disariya sizdirilmaz.
    return {"detail": "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi."}


@router.post("/reset-password", response_model=Token)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalı")

    user_id = service.verify_reset_token(payload.token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Kullanıcı bulunamadı")

    user.hashed_password = service.hash_password(payload.new_password)
    db.commit()
    logger.info("Şifre sıfırlandı: id=%s", user.id)

    # Sifirlama sonrasi kullaniciyi otomatik giris yaptir.
    access_token = service.create_access_token(subject=str(user.id))
    return Token(access_token=access_token)
