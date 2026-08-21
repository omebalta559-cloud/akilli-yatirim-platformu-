import asyncio
import io
import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.service import get_current_user_id
from app.modules.market_data import service as market_data_service
from app.modules.portfolio import gorsel_okuyucu, importer
from app.modules.portfolio import performance as performance_service
from app.modules.portfolio import report as report_service
from app.modules.portfolio.models import Holding, PortfolioSnapshot
from app.modules.portfolio.schemas import (
    HoldingCreate,
    HoldingOut,
    ImportSatirHatasi,
    ImportSonucu,
    PortfolioSnapshotOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/", response_model=list[HoldingOut])
def list_holdings(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active.is_(True))
        .order_by(Holding.created_at.desc())
        .all()
    )


@router.get("/history", response_model=list[HoldingOut])
def holdings_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(Holding)
        .filter(Holding.user_id == user_id)
        .order_by(Holding.created_at.desc())
        .all()
    )


@router.post("/", response_model=HoldingOut)
def add_holding(
    payload: HoldingCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holding = Holding(user_id=user_id, **payload.model_dump())
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.post("/import", response_model=ImportSonucu)
async def import_holdings(
    file: UploadFile,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Araci kurum/banka CSV ekstresinden varliklari toplu ekler.

    Elle giris ilk kullanimdaki en buyuk surtunme noktasiydi: kullanici her
    varligi tek tek eklemek zorunda kaliyordu.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Lütfen bir .csv dosyası yükleyin.")

    ham = await file.read()
    if len(ham) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya çok büyük (en fazla 2 MB).")

    # Excel'den cikan dosyalar sik sik BOM'lu UTF-8 ya da Windows-1254 oluyor.
    for kodlama in ("utf-8-sig", "cp1254", "latin-1"):
        try:
            metin = ham.decode(kodlama)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(status_code=400, detail="Dosya okunamadı, kodlaması desteklenmiyor.")

    eklenen = 0
    hatalar: list[ImportSatirHatasi] = []
    for satir_no, kayit, hata in importer.satirlari_oku(io.StringIO(metin)):
        if hata:
            if len(hatalar) < 20:          # cok uzun hata listesi kullaniciya yardimci olmuyor
                hatalar.append(ImportSatirHatasi(satir=satir_no, hata=hata))
            continue
        db.add(Holding(user_id=user_id, **kayit))
        eklenen += 1

    if eklenen:
        db.commit()

    logger.info("Portfoy CSV aktarimi: kullanici=%s eklenen=%d hatali=%d", user_id, eklenen, len(hatalar))
    return ImportSonucu(eklenen=eklenen, atlanan=len(hatalar), hatalar=hatalar)



@router.post("/import-image", response_model=ImportSonucu)
async def import_holdings_from_image(
    file: UploadFile,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Portfoy ekran goruntusunden varliklari toplu ekler.

    CSV yolu araci kurumdan dosya indirmeyi gerektiriyor; cogu kullanici icin
    en kisa yol telefondaki uygulamanin ekran goruntusu.
    """
    if file.content_type not in gorsel_okuyucu.GECERLI_TIPLER:
        raise HTTPException(
            status_code=400,
            detail="Lütfen PNG, JPEG veya WEBP bir görsel yükleyin.",
        )

    ham = await file.read()
    if len(ham) > gorsel_okuyucu.MAKS_BOYUT:
        raise HTTPException(status_code=400, detail="Görsel çok büyük (en fazla 4 MB).")
    if not ham:
        raise HTTPException(status_code=400, detail="Dosya boş.")

    try:
        # Model cagrisi senkron; olay dongusunu bloklamamasi icin thread'e aliniyor.
        kayitlar, hatalar = await asyncio.to_thread(
            gorsel_okuyucu.gorselden_oku, ham, file.content_type
        )
    except Exception:
        logger.exception("Gorselden portfoy okuma basarisiz (user_id=%s)", user_id)
        raise HTTPException(
            status_code=503,
            detail="Görsel şu an okunamadı, lütfen birkaç saniye sonra tekrar deneyin.",
        )

    eklenen = 0
    notlar: list[str] = []
    for kayit in kayitlar:
        if kayit["purchase_price"] is None:
            # Elle yazilmis listede alis maliyeti yok; guncel fiyattan ekleyip
            # kullaniciyi uyariyoruz. Sessizce sifir yazmak reel getiriyi bozar.
            guncel = await market_data_service.get_current_price(
                kayit["asset_type"], kayit["asset_symbol"]
            )
            if guncel is None:
                hatalar.append(f"{kayit['asset_symbol']}: alış fiyatı görselde yok ve güncel fiyat alınamadı")
                continue
            kayit["purchase_price"] = guncel
            notlar.append(
                f"{kayit['asset_symbol']}: alış fiyatı görselde yoktu, güncel fiyat "
                f"({guncel:,.2f}) kullanıldı — portföyden düzeltebilirsin."
            )
        db.add(Holding(user_id=user_id, **kayit))
        eklenen += 1

    if eklenen:
        db.commit()

    logger.info(
        "Gorselden portfoy aktarimi: kullanici=%s eklenen=%d elenen=%d fiyatsiz=%d",
        user_id, eklenen, len(hatalar), len(notlar),
    )
    return ImportSonucu(
        eklenen=eklenen,
        atlanan=len(hatalar),
        hatalar=[ImportSatirHatasi(satir=i, hata=h) for i, h in enumerate(hatalar[:20], start=1)],
        notlar=notlar[:20],
    )
    return ImportSonucu(
        eklenen=len(kayitlar),
        atlanan=len(hatalar),
        hatalar=[ImportSatirHatasi(satir=i, hata=h) for i, h in enumerate(hatalar[:20], start=1)],
    )

@router.get("/performance", response_model=list[PortfolioSnapshotOut])
async def get_performance(
    user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    await performance_service.ensure_today_snapshot(db, user_id)
    return (
        db.query(PortfolioSnapshot)
        .filter(PortfolioSnapshot.user_id == user_id)
        .order_by(PortfolioSnapshot.snapshot_date.asc())
        .all()
    )


@router.get("/report")
async def download_report(
    format: Literal["csv", "pdf"] = Query("pdf"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active.is_(True))
        .all()
    )
    rows = await report_service.build_report_rows(holdings)

    if format == "csv":
        content = report_service.build_csv(rows)
        media_type = "text/csv"
        filename = "portfoy_raporu.csv"
    else:
        content = report_service.build_pdf(rows)
        media_type = "application/pdf"
        filename = "portfoy_raporu.pdf"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == user_id, Holding.is_active.is_(True))
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Varlık bulunamadı.")

    holding.is_active = False
    holding.removed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}
