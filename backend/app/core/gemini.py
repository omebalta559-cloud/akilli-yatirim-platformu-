"""Gemini cagrilari icin ortak katman: model zinciri, kota yedegi, token olcumu.

Neden zincir: ucretsiz katmanda gunluk istek kotasi **model basina** sayiliyor
(quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier, deger 20). Tek
modele bagli kalmak gunde 20 istek demek; olcum yaparken bu kota bitti ve hem
asistan hem gorsel okuma calismaz oldu. Ayni istegi sirayla birden fazla modele
denemek gunluk kapasiteyi model sayisiyla carpiyor.

Ayrica modeller artik takma adla degil acik surumle cagriliyor. "flash-latest"
takma adi bugun gemini-3.7-flash'a cozuluyordu; Google bunu degistirdiginde hem
davranis hem maliyet habersiz degisir.
"""

import logging
import os
import time

import google.generativeai as genai

from app.core.config import settings

# Anahtar burada yapilandiriliyor: Gemini kullanan her modul bu katmandan geciyor,
# boylece cagri sirasina bagli bir baslatma hatasi olusmuyor.
genai.configure(api_key=settings.gemini_api_key)

logger = logging.getLogger(__name__)

# Sirayla denenir. Ilki tukenince digerine gecilir; hepsi tukenirse hata yukselir.
# Ortam degiskeniyle degistirilebilir ki yeniden dagitim yapmadan mudahale edilebilsin.
VARSAYILAN_ZINCIR = [
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
]

MODEL_ZINCIRI = [
    m.strip() for m in os.getenv("GEMINI_MODEL_ZINCIRI", ",".join(VARSAYILAN_ZINCIR)).split(",") if m.strip()
]

# Fiyatlar 1M token basina dolar (Flash tanitim fiyati); log satirindaki
# maliyet tahmini bunlardan hesaplaniyor.
GIRDI_FIYATI = 0.75
CIKTI_FIYATI = 3.75


def _kota_hatasi_mi(hata: Exception) -> bool:
    metin = str(hata).lower()
    return "429" in metin or "resource_exhausted" in metin or "quota" in metin


def _gecici_hata_mi(hata: Exception) -> bool:
    metin = str(hata).lower()
    return any(im in metin for im in ("503", "unavailable", "high demand", "overloaded", "timeout"))


def _dusunme_kapatilabilir_mi() -> bool:
    """Eski SDK surumleri thinking_config alanini tanimiyor; tanimayan surume
    bu alani gondermek istegi calisma aninda patlatir."""
    try:
        from google.ai import generativelanguage as glm

        return "thinking_config" in glm.GenerationConfig.meta.fields
    except Exception:
        return False


DUSUNME_KAPATILABILIR = _dusunme_kapatilabilir_mi()


def _model_olustur(model_adi: str, system_instruction: str):
    # Dusunme tokenlari cikti fiyatindan faturalaniyor ve olcumde gorunen
    # yanitin bes katina cikiyordu. Yanit zaten kisa tutuldugu icin ic akil
    # yurutmeye ihtiyac yok.
    if DUSUNME_KAPATILABILIR:
        return genai.GenerativeModel(
            model_adi,
            system_instruction=system_instruction,
            generation_config={"thinking_config": {"thinking_budget": 0}},
        )
    return genai.GenerativeModel(model_adi, system_instruction=system_instruction)


def _kullanimi_logla(model_adi: str, response, sure: float) -> None:
    kullanim = getattr(response, "usage_metadata", None)
    if kullanim is None:
        return
    girdi = getattr(kullanim, "prompt_token_count", 0) or 0
    cikti = getattr(kullanim, "candidates_token_count", 0) or 0
    dusunme = getattr(kullanim, "thoughts_token_count", 0) or 0
    maliyet = (girdi * GIRDI_FIYATI + (cikti + dusunme) * CIKTI_FIYATI) / 1_000_000
    logger.info(
        "TOKEN model=%s girdi=%d cikti=%d dusunme=%d maliyet=$%.6f sure=%.2fsn",
        model_adi, girdi, cikti, dusunme, maliyet, sure,
    )


def uret(system_instruction: str, icerik, model_basina_deneme: int = 2):
    """Icerigi zincirdeki ilk calisan modele urettirir.

    icerik: metin ya da [metin, {"mime_type": ..., "data": ...}] gibi parca listesi.

    Kota dolan modelde beklemeden bir sonrakine gecilir -- beklemek bir sey
    degistirmez, kota gun boyu dolu kalir. Gecici yogunlukta (503) ise ayni
    model kisa bir bekleme sonrasi tekrar denenir.
    """
    son_hata = None
    for model_adi in MODEL_ZINCIRI:
        model = _model_olustur(model_adi, system_instruction)
        for deneme in range(1, model_basina_deneme + 1):
            try:
                t0 = time.perf_counter()
                yanit = model.generate_content(icerik)
                _kullanimi_logla(model_adi, yanit, time.perf_counter() - t0)
                return yanit
            except Exception as hata:
                son_hata = hata
                if _kota_hatasi_mi(hata):
                    logger.warning("%s kotasi dolu, sonraki modele geciliyor", model_adi)
                    break
                if _gecici_hata_mi(hata) and deneme < model_basina_deneme:
                    logger.warning("%s gecici hata verdi (deneme %d), tekrar deneniyor", model_adi, deneme)
                    time.sleep(1.0)
                    continue
                logger.warning("%s kalici hata verdi: %s", model_adi, hata)
                break

    logger.error("Zincirdeki butun modeller basarisiz oldu (%s)", ", ".join(MODEL_ZINCIRI))
    raise son_hata
