import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(to: str, subject: str, body: str) -> None:
    """E-postayi Brevo'nun HTTPS API'si uzerinden gonderir.

    Render giden SMTP portlarini (25/465/587) engelledigi icin smtplib ile
    gonderim "Network is unreachable" hatasi veriyordu; bu yuzden HTTPS (443)
    uzerinden calisan Brevo API'si kullaniliyor.
    """
    if not settings.brevo_api_key or not settings.email_sender:
        logger.info(
            "BREVO_API_KEY veya EMAIL_SENDER ayarlanmamis; e-posta gonderilmedi (alici: %s).",
            to,
        )
        return

    payload = {
        "sender": {"name": settings.email_sender_name or "Akıllı Portföy", "email": settings.email_sender},
        "to": [{"email": to}],
        "subject": subject,
        "textContent": body,
    }
    headers = {
        "api-key": settings.brevo_api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    response = httpx.post(BREVO_API_URL, headers=headers, json=payload, timeout=20)
    # Hata durumunda cagiran taraf (arka plan gorevi) yakalayip loglar.
    response.raise_for_status()
