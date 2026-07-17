import csv
import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

from app.modules.market_data import service as market_data_service
from app.modules.portfolio.models import Holding

COLUMN_HEADERS = [
    "Varlik",
    "Tur",
    "Miktar",
    "Alis Fiyati",
    "Guncel Fiyat",
    "Guncel Deger",
    "Kar/Zarar",
    "Kar/Zarar %",
]


async def build_report_rows(holdings: list[Holding]) -> list[dict]:
    rows = []
    for h in holdings:
        current_price = await market_data_service.get_current_price(h.asset_type, h.asset_symbol)
        current_value = (current_price * h.quantity) if current_price is not None else None
        invested = h.purchase_price * h.quantity
        gain_amount = (current_value - invested) if current_value is not None else None
        gain_percent = (
            (current_price - h.purchase_price) / h.purchase_price * 100
            if current_price is not None and h.purchase_price
            else None
        )
        rows.append(
            {
                "symbol": h.asset_symbol,
                "type": h.asset_type,
                "quantity": h.quantity,
                "purchase_price": h.purchase_price,
                "current_price": current_price,
                "current_value": current_value,
                "gain_amount": gain_amount,
                "gain_percent": gain_percent,
            }
        )
    return rows


def _fmt(value, suffix: str = "") -> str:
    if value is None:
        return "Yok"
    return f"{value:,.2f}{suffix}".replace(",", "X").replace(".", ",").replace("X", ".")


def build_csv(rows: list[dict]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(COLUMN_HEADERS)
    for r in rows:
        writer.writerow(
            [
                r["symbol"],
                r["type"],
                r["quantity"],
                _fmt(r["purchase_price"]),
                _fmt(r["current_price"]),
                _fmt(r["current_value"]),
                _fmt(r["gain_amount"]),
                _fmt(r["gain_percent"], "%"),
            ]
        )
    return buffer.getvalue().encode("utf-8-sig")


def build_pdf(rows: list[dict]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Akilli Yatirim Danismani - Portfoy Raporu", styles["Title"]))
    elements.append(
        Paragraph(
            f"Olusturulma tarihi: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M')} (UTC)",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 0.5 * cm))

    table_data = [COLUMN_HEADERS]
    total_invested = 0.0
    total_current = 0.0
    for r in rows:
        table_data.append(
            [
                r["symbol"],
                r["type"],
                str(r["quantity"]),
                _fmt(r["purchase_price"]),
                _fmt(r["current_price"]),
                _fmt(r["current_value"]),
                _fmt(r["gain_amount"]),
                _fmt(r["gain_percent"], "%"),
            ]
        )
        total_invested += r["purchase_price"] * r["quantity"]
        total_current += r["current_value"] if r["current_value"] is not None else r["purchase_price"] * r["quantity"]

    table = Table(table_data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2a78d6")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d7dee5")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafd")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 0.5 * cm))

    gain_amount = total_current - total_invested
    gain_percent = (gain_amount / total_invested * 100) if total_invested else 0
    elements.append(Paragraph(f"Toplam Yatirilan: {_fmt(total_invested)} TL", styles["Normal"]))
    elements.append(Paragraph(f"Guncel Toplam Deger: {_fmt(total_current)} TL", styles["Normal"]))
    elements.append(
        Paragraph(f"Toplam Kar/Zarar: {_fmt(gain_amount)} TL ({_fmt(gain_percent, '%')})", styles["Normal"])
    )
    elements.append(Spacer(1, 0.5 * cm))
    elements.append(
        Paragraph(
            "Bu rapor yatirim tavsiyesi degildir, yalnizca bilgilendirme amaclidir.",
            styles["Italic"],
        )
    )

    doc.build(elements)
    return buffer.getvalue()
