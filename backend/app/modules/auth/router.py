from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import GoogleAuthRequest, Token, UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    user = User(email=payload.email, hashed_password=service.hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

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

    token = service.create_access_token(subject=str(user.id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not service.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")

    token = service.create_access_token(subject=str(user.id))
    return Token(access_token=token)
