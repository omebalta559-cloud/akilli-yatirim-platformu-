from datetime import datetime

from pydantic import BaseModel


class LeadOut(BaseModel):
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    title: str | None = None
    company_name: str | None = None
    phone: str | None = None
    industry: str | None = None
    email_status: str | None = None
    status: str
    send_attempts: int
    last_error: str | None = None
    contacted_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ImportResult(BaseModel):
    total_rows: int  # dosyadaki toplam satir (baslik haric)
    imported: int  # yeni eklenen lead sayisi
    skipped_existing: int  # e-postasi zaten kayitli oldugu icin atlanan
    skipped_no_email: int  # gecerli e-posta olmadigi icin atlanan


class CampaignSendRequest(BaseModel):
    # Kampanya etiketi (log icin): "lansman", "tanitim-1" ...
    campaign: str = "genel"
    # Konu ve govde sablonu. Kisisellestirme icin su yer tutucular kullanilabilir:
    # {first_name} {last_name} {company_name} {title}
    subject: str
    body: str
    # Bu cagride en fazla kac mail atilsin (Gmail gunluk limitini asmamak icin).
    # Bos birakilirsa config'teki gunluk guvenli limit kullanilir.
    limit: int | None = None


class CampaignSendResult(BaseModel):
    attempted: int
    sent: int
    failed: int
    remaining_pending: int  # hala bekleyen (bir sonraki calistirmada gonderilecek)
    detail: str


class OutreachStats(BaseModel):
    total: int
    pending: int
    sent: int
    failed: int
    unsubscribed: int
