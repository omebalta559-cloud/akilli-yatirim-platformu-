from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base

# Bir kisiye (lead) mail atma sureci: once Excel'den ice aktarilir ("pending"),
# kampanya calisinca tek tek mail atilir ve "sent"/"failed" olarak isaretlenir.
# "kime atildi kime atilmadi" sorusu dogrudan Lead.status ile cevaplanir.
LEAD_STATUS_PENDING = "pending"
LEAD_STATUS_SENT = "sent"
LEAD_STATUS_FAILED = "failed"
LEAD_STATUS_UNSUBSCRIBED = "unsubscribed"


class Lead(Base):
    """Apollo.io (veya benzeri) disariya aktarilmis potansiyel musteri kaydi."""

    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)

    # Kisisel bilgiler
    email = Column(String, nullable=False, unique=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    title = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    website = Column(String, nullable=True)

    # Kaynak / kalite
    source = Column(String, nullable=False, server_default="apollo")
    # Apollo'nun e-posta dogrulama durumu: "Verified" | "Catch-all" | "Unavailable" ...
    email_status = Column(String, nullable=True)

    # Gonderim takibi
    status = Column(String, nullable=False, default=LEAD_STATUS_PENDING, server_default=LEAD_STATUS_PENDING, index=True)
    send_attempts = Column(Integer, nullable=False, default=0, server_default="0")
    last_error = Column(Text, nullable=True)
    contacted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OutreachEmail(Base):
    """Tek bir mail gonderim denemesinin kaydi (tam gecmis / denetim izi)."""

    __tablename__ = "outreach_emails"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    # Hangi kampanya kapsaminda gonderildi (etiket): "lansman", "tanitim-1" vb.
    campaign = Column(String, nullable=False, index=True)
    subject = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "sent" | "failed"
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
