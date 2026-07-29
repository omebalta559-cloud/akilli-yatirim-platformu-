import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.modules.outreach import service
from app.modules.outreach.models import Lead
from app.modules.outreach.schemas import (
    CampaignSendRequest,
    CampaignSendResult,
    ImportResult,
    LeadOut,
    OutreachStats,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/outreach", tags=["outreach"])


def require_admin(x_admin_token: str = Header(default="")) -> None:
    """Bu modulun tum uclarini korur: 10.000 kisiye mail atabilen ve tum lead
    listesini gosteren uclar herkese acik olamaz. X-Admin-Token basligi,
    config'teki OUTREACH_ADMIN_TOKEN ile birebir eslesmelidir.
    """
    expected = settings.outreach_admin_token
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="OUTREACH_ADMIN_TOKEN ayarlanmamis; outreach uclari guvenlik geregi kapali.",
        )
    if x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Gecersiz admin token (X-Admin-Token).")


@router.get("/stats", response_model=OutreachStats, dependencies=[Depends(require_admin)])
def stats(db: Session = Depends(get_db)):
    return service.get_stats(db)


@router.get("/leads", response_model=list[LeadOut], dependencies=[Depends(require_admin)])
def list_leads(
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    return query.order_by(Lead.id).offset(offset).limit(min(limit, 1000)).all()


@router.post("/leads/import", response_model=ImportResult, dependencies=[Depends(require_admin)])
async def import_leads(file: UploadFile, db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Lutfen bir .xlsx (Excel) dosyasi yukleyin.")
    try:
        result = service.import_leads_from_file(db, file.file)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Lead ice aktarma basarisiz")
        raise HTTPException(status_code=400, detail=f"Dosya islenemedi: {exc}")
    return result


@router.post("/campaigns/test", dependencies=[Depends(require_admin)])
def send_test(to: str, subject: str = "Test", body: str = "Merhaba {first_name}, bu bir test mailidir."):
    """Sablonu ve SMTP ayarlarini dogrulamak icin tek bir adrese ornek mail atar.
    Kisisellestirme yer tutuculari ornek degerlerle doldurulur.
    """
    sample = Lead(email=to, first_name="Ahmet", last_name="Yilmaz", title="Yatirim Muduru", company_name="Ornek A.S.")
    from app.modules.outreach.service import _render  # yerel import: sadece test ucunda

    rendered_subject = _render(subject, sample)
    rendered_body = _render(body, sample)

    import smtplib
    from email.message import EmailMessage
    from email.utils import formataddr

    if not settings.smtp_user or not settings.smtp_password:
        raise HTTPException(status_code=503, detail="SMTP_USER / SMTP_PASSWORD ayarlanmamis.")

    message = EmailMessage()
    message["From"] = formataddr((settings.outreach_from_name or None, settings.smtp_user))
    message["To"] = to
    message["Subject"] = rendered_subject
    message.set_content(rendered_body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Test maili gonderilemedi: {exc}")
    return {"detail": f"Test maili {to} adresine gonderildi.", "subject": rendered_subject}


@router.post("/campaigns/send", response_model=CampaignSendResult, dependencies=[Depends(require_admin)])
def send_campaign(
    payload: CampaignSendRequest,
    background_tasks: BackgroundTasks,
    background: bool = True,
    db: Session = Depends(get_db),
):
    """Bekleyen kisilere kampanya maili atar.

    - background=True (varsayilan): gonderim arka planda baslar, uc hemen doner.
      Ilerlemeyi GET /outreach/stats ile izleyin. Yuzlerce mail uzun surdugu icin
      HTTP zaman asimina takilmamak adina onerilen yol budur.
    - background=False: kucuk/test gonderimler icin senkron calisir, gercek
      gonderim sayilarini doner.
    """
    pending = service._count_pending(db)
    if pending == 0:
        return CampaignSendResult(attempted=0, sent=0, failed=0, remaining_pending=0, detail="Bekleyen kisi yok.")

    if not background:
        result = service.send_campaign(db, payload.campaign, payload.subject, payload.body, payload.limit)
        return CampaignSendResult(**result)

    def run_in_background():
        session = SessionLocal()
        try:
            service.send_campaign(session, payload.campaign, payload.subject, payload.body, payload.limit)
        except Exception:
            logger.exception("Arka plan kampanya gonderimi basarisiz")
        finally:
            session.close()

    background_tasks.add_task(run_in_background)
    queued = min(payload.limit or settings.outreach_daily_limit, pending)
    return CampaignSendResult(
        attempted=0,
        sent=0,
        failed=0,
        remaining_pending=pending,
        detail=f"Gonderim arka planda basladi (~{queued} mail). Ilerleme icin GET /outreach/stats.",
    )
