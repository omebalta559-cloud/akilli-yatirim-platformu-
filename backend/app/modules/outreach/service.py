import logging
import smtplib
import time
from email.message import EmailMessage
from email.utils import formataddr
from typing import BinaryIO

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.outreach import importer
from app.modules.outreach.models import (
    LEAD_STATUS_FAILED,
    LEAD_STATUS_PENDING,
    LEAD_STATUS_SENT,
    LEAD_STATUS_UNSUBSCRIBED,
    Lead,
    OutreachEmail,
)

logger = logging.getLogger(__name__)

# Kisisellestirme icin desteklenen yer tutucular: {first_name} vb.
_PLACEHOLDER_FIELDS = ("first_name", "last_name", "title", "company_name")


def _looks_like_email(value: str | None) -> bool:
    if not value:
        return False
    # Cok basit ama Excel'deki bariz bos/bozuk degerleri elemeye yeter.
    return "@" in value and "." in value.split("@")[-1] and " " not in value


def import_leads_from_file(db: Session, file: BinaryIO) -> dict[str, int]:
    """Excel dosyasindaki kisileri veritabanina aktarir (e-postaya gore tekil).

    Zaten kayitli e-postalar atlanir; boylece ayni dosya birden fazla kez
    yuklenirse cift kayit olusmaz ve mevcut gonderim durumu korunur.
    """
    total_rows = 0
    imported = 0
    skipped_existing = 0
    skipped_no_email = 0

    # Ayni yukleme icinde tekrar eden e-postalari da yakalamak icin.
    seen_in_file: set[str] = set()
    batch: list[Lead] = []
    BATCH_SIZE = 500

    for record in importer.parse_leads(file):
        total_rows += 1
        email = (record.get("email") or "").lower()

        if not _looks_like_email(email):
            skipped_no_email += 1
            continue
        if email in seen_in_file:
            skipped_existing += 1
            continue
        seen_in_file.add(email)

        exists = db.query(Lead.id).filter(Lead.email == email).first()
        if exists:
            skipped_existing += 1
            continue

        batch.append(
            Lead(
                email=email,
                first_name=record.get("first_name"),
                last_name=record.get("last_name"),
                title=record.get("title"),
                company_name=record.get("company_name"),
                phone=record.get("phone"),
                linkedin_url=record.get("linkedin_url"),
                industry=record.get("industry"),
                city=record.get("city"),
                country=record.get("country"),
                website=record.get("website"),
                email_status=record.get("email_status"),
                source="apollo",
                status=LEAD_STATUS_PENDING,
            )
        )
        imported += 1

        if len(batch) >= BATCH_SIZE:
            db.add_all(batch)
            db.commit()
            batch = []

    if batch:
        db.add_all(batch)
        db.commit()

    logger.info(
        "Lead ice aktarma tamamlandi: %d yeni, %d mevcut/atlandi, %d e-postasiz (toplam %d satir)",
        imported,
        skipped_existing,
        skipped_no_email,
        total_rows,
    )
    return {
        "total_rows": total_rows,
        "imported": imported,
        "skipped_existing": skipped_existing,
        "skipped_no_email": skipped_no_email,
    }


def _render(template: str, lead: Lead) -> str:
    """Sablondaki {first_name} gibi yer tutuculari lead bilgileriyle degistirir.

    str.format kullanilmaz: govde metninde suslu parantez ({ }) bulunursa
    patlamamasi icin yalnizca bilinen alanlar birebir degistirilir.
    """
    result = template
    for field in _PLACEHOLDER_FIELDS:
        value = getattr(lead, field, None) or ""
        result = result.replace("{" + field + "}", value)
    return result


def get_stats(db: Session) -> dict[str, int]:
    rows = dict(
        db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    )
    return {
        "total": sum(rows.values()),
        "pending": rows.get(LEAD_STATUS_PENDING, 0),
        "sent": rows.get(LEAD_STATUS_SENT, 0),
        "failed": rows.get(LEAD_STATUS_FAILED, 0),
        "unsubscribed": rows.get(LEAD_STATUS_UNSUBSCRIBED, 0),
    }


def send_campaign(db: Session, campaign: str, subject: str, body: str, limit: int | None) -> dict:
    """Bekleyen (pending) kisilere sirayla mail atar, sonucu isaretler.

    - Tek bir SMTP baglantisi acilir ve tum toplu gonderimde tekrar kullanilir
      (her mail icin yeniden baglanmak Gmail tarafindan engellenir).
    - Her mailden sonra veritabanina yazilir; olasi bir cokme durumunda
      nereye kadar gonderildigi kaybolmaz, kaldigi yerden devam eder.
    - Gonderimler arasinda kisa bir bekleme (rate limit) uygulanir.
    """
    if not settings.smtp_user or not settings.smtp_password:
        return {
            "attempted": 0,
            "sent": 0,
            "failed": 0,
            "remaining_pending": _count_pending(db),
            "detail": "SMTP kullanici/parola ayarlanmamis (SMTP_USER / SMTP_PASSWORD). Gonderim yapilmadi.",
        }

    effective_limit = limit if limit and limit > 0 else settings.outreach_daily_limit
    leads = (
        db.query(Lead)
        .filter(Lead.status == LEAD_STATUS_PENDING)
        .order_by(Lead.id)
        .limit(effective_limit)
        .all()
    )

    if not leads:
        return {
            "attempted": 0,
            "sent": 0,
            "failed": 0,
            "remaining_pending": 0,
            "detail": "Gonderilecek bekleyen kisi yok.",
        }

    from_header = formataddr((settings.outreach_from_name or None, settings.smtp_user))

    sent = 0
    failed = 0
    attempted = 0

    try:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30)
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
    except Exception as exc:
        logger.exception("SMTP baglantisi/oturum acilamadi")
        return {
            "attempted": 0,
            "sent": 0,
            "failed": 0,
            "remaining_pending": _count_pending(db),
            "detail": f"SMTP baglantisi kurulamadi: {exc}",
        }

    try:
        for index, lead in enumerate(leads):
            attempted += 1
            rendered_subject = _render(subject, lead)
            rendered_body = _render(body, lead)

            message = EmailMessage()
            message["From"] = from_header
            message["To"] = lead.email
            message["Subject"] = rendered_subject
            message.set_content(rendered_body)

            lead.send_attempts += 1
            try:
                server.send_message(message)
                lead.status = LEAD_STATUS_SENT
                lead.contacted_at = func.now()
                lead.last_error = None
                log_status = "sent"
                log_error = None
                sent += 1
            except smtplib.SMTPServerDisconnected:
                # Baglanti koptu: bu kisiyi beklemede birak, donguyu guvenli bitir.
                lead.send_attempts -= 1
                attempted -= 1
                logger.warning("SMTP baglantisi koptu, kampanya erken sonlandirildi (%d gonderildi)", sent)
                break
            except Exception as exc:  # noqa: BLE001 - tekil hatayi kaydedip devam et
                lead.status = LEAD_STATUS_FAILED
                lead.last_error = str(exc)[:1000]
                log_status = "failed"
                log_error = str(exc)[:1000]
                failed += 1
                logger.warning("Mail gonderilemedi (%s): %s", lead.email, exc)

            db.add(
                OutreachEmail(
                    lead_id=lead.id,
                    campaign=campaign,
                    subject=rendered_subject,
                    status=log_status,
                    error=log_error,
                )
            )
            db.commit()

            # Rate limit: son mailden sonra beklemeye gerek yok.
            if index < len(leads) - 1 and settings.outreach_send_delay_seconds > 0:
                time.sleep(settings.outreach_send_delay_seconds)
    finally:
        try:
            server.quit()
        except Exception:
            pass

    remaining = _count_pending(db)
    logger.info(
        "Kampanya '%s' bitti: %d gonderildi, %d hata, %d hala bekliyor",
        campaign,
        sent,
        failed,
        remaining,
    )
    return {
        "attempted": attempted,
        "sent": sent,
        "failed": failed,
        "remaining_pending": remaining,
        "detail": f"{sent} mail gonderildi, {failed} hata. {remaining} kisi hala bekliyor.",
    }


def _count_pending(db: Session) -> int:
    return db.query(func.count(Lead.id)).filter(Lead.status == LEAD_STATUS_PENDING).scalar() or 0
