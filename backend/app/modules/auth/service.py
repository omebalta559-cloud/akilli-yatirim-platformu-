from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Render ucretsiz katmani 0.1 CPU veriyor; passlib'in varsayilan 12 turu bu
# donanimda girisi 7-9 saniyeye cikariyordu (olculdu). 10 tur OWASP'in
# onerdigi alt sinir ve ayni donanimda yaklasik 4 kat hizli.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_minutes: int = 60 * 24) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_reset_token(subject: str, expires_minutes: int = 15) -> str:
    """Sifre sifirlama icin kisa omurlu, 'reset' tipli JWT. Erisim token'i
    yerine kullanilamaz (get_current_user_id 'reset' tipli token'i reddeder)."""
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "exp": expire, "type": "reset"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_reset_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Geçersiz sıfırlama bağlantısı")
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=400, detail="Sıfırlama bağlantısı geçersiz veya süresi dolmuş")


def verify_google_token(credential: str) -> str:
    try:
        payload = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Geçersiz Google kimlik doğrulaması")
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Google hesabında e-posta bulunamadı")
    return email


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> int:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        # Sifre sifirlama token'i erisim token'i olarak kullanilamaz.
        if payload.get("type") == "reset":
            raise HTTPException(status_code=401, detail="Bu token oturum için geçerli değil")
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")


def parola_yenilenmeli_mi(hashed_password: str) -> bool:
    """Eski (yuksek turlu) hash'ler girise girdikce yeni tura tasinsin diye.

    bcrypt tur sayisini hash'in icinde tasidigi icin tur dusurmek mevcut
    kullanicilarin giris suresini kendiliginden kisaltmiyor; ilk basarili
    girislerinde yeniden hash'lemek gerekiyor.
    """
    return pwd_context.needs_update(hashed_password)
