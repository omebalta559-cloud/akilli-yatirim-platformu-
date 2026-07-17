import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.smtp_user or not settings.smtp_password:
        return

    message = EmailMessage()
    message["From"] = settings.smtp_user
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)
