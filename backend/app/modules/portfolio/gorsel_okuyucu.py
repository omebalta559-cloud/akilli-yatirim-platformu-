"""Portfoy ekran goruntusunden varlik cikarma.

Elle giris ilk kullanimdaki en buyuk surtunme noktasiydi. CSV ile toplu ekleme
bunu kismen cozdu ama kullanicinin once araci kurumdan CSV indirmesi gerekiyor.
Cogu kullanici icin en kolay yol telefondaki uygulamanin ekran goruntusu.

Modelin ciktisina guvenmiyoruz: donen her satir CSV yolundaki ayni dogrulamadan
(tur eslemesi, pozitif adet/fiyat) geciyor.
"""

import json
import logging
import re
import time

import google.generativeai as genai

from app.modules.portfolio.importer import GECERLI_TURLER, _TUR_ESLEME, _sadelestir

logger = logging.getLogger(__name__)

MAKS_BOYUT = 4 * 1024 * 1024
GECERLI_TIPLER = {"image/png", "image/jpeg", "image/webp"}

# Serbest metin degil, dogrudan JSON istiyoruz; boylece cikti ayristirmasi
# modelin uslubuna bagli kalmiyor.
YONERGE = (
    "Sen bir portfoy ekstresi okuyucususun. Verilen ekran goruntusundeki varliklari "
    "cikar ve SADECE gecerli bir JSON dizisi dondur, baska hicbir sey yazma. "
    "Her ogede su alanlar olsun: asset_symbol (string), asset_type "
    f"({'|'.join(sorted(GECERLI_TURLER))}), quantity (sayi), purchase_price (sayi, birim maliyet). "
    "Turkce sayi bicimini dogru cevir: '1.250' bin ikiyuz elli, '12,4080' virgullu ondalik. "
    "Toplam/ara toplam satirlarini alma. Emin olmadigin satiri atla. "
    "Hicbir varlik goremezsen bos dizi dondur."
)

# Olculdu: gorseli tanimak icin dusunme tokeni acik kalsa da maliyet gorsel
# basina ~0,003 dolar. Butceyi sifira cekmek modelin okuma dogrulugunu
# dusurdugu icin varsayilanda birakildi.
MODEL_ADI = "gemini-flash-latest"
DENEME_SAYISI = 4


def _json_ayikla(metin: str) -> list:
    """Model bazen JSON'u ``` bloguna sariyor; ham diziyi cikarir."""
    temiz = re.sub(r"^```(?:json)?|```$", "", metin.strip(), flags=re.MULTILINE).strip()
    veri = json.loads(temiz)
    if not isinstance(veri, list):
        raise ValueError("Beklenen JSON dizisi degil")
    return veri


def _kaydi_dogrula(ham: dict) -> tuple[dict | None, str | None]:
    """Modelin urettigi tek bir kaydi CSV yolundaki kurallarla dogrular."""
    if not isinstance(ham, dict):
        return None, "Beklenmeyen kayit bicimi"

    tur = _TUR_ESLEME.get(_sadelestir(str(ham.get("asset_type", ""))))
    if tur is None:
        return None, f"Taninmayan varlik turu: '{ham.get('asset_type')}'"

    sembol = str(ham.get("asset_symbol", "")).strip().upper()
    if not sembol:
        return None, "Sembol bos"

    try:
        adet = float(ham.get("quantity"))
        fiyat = float(ham.get("purchase_price"))
    except (TypeError, ValueError):
        return None, "Adet veya fiyat sayiya cevrilemedi"

    if adet <= 0:
        return None, f"Adet pozitif olmali: {adet}"
    if fiyat <= 0:
        return None, f"Fiyat pozitif olmali: {fiyat}"

    return {
        "asset_type": tur,
        "asset_symbol": sembol,
        "quantity": adet,
        "purchase_price": fiyat,
    }, None


def _gecici_hata_mi(hata: Exception) -> bool:
    """Sadece gecici sunucu hatalarinda tekrar denemek icin.

    503 "high demand" ve 429 kota hatalari birkac saniye sonra genelde geciyor;
    gecersiz istek gibi kalici hatalarda beklemek bosuna gecikme demek.
    """
    metin = str(hata).lower()
    return any(im in metin for im in ("503", "unavailable", "high demand", "429", "overloaded", "timeout"))


def _modeli_cagir(icerik: bytes, mime: str):
    """503 'high demand' gecici bir durum; canli kullanimda ozelligi bozuk
    gostermemesi icin kisa araliklarla yeniden deneniyor. Beklemeler bilerek
    kisa: toplam gecikme kullanicinin bekledigi sureye ekleniyor."""
    model = genai.GenerativeModel(MODEL_ADI, system_instruction=YONERGE)
    parcalar = [
        {"mime_type": mime, "data": icerik},
        "Bu ekstredeki varliklari cikar.",
    ]

    son_hata = None
    for deneme in range(1, DENEME_SAYISI + 1):
        try:
            return model.generate_content(parcalar)
        except Exception as hata:
            son_hata = hata
            if not _gecici_hata_mi(hata):
                logger.warning("Gorsel okuma kalici hata verdi, tekrar denenmiyor: %s", hata)
                raise
            logger.warning("Gorsel okuma denemesi %d gecici hatayla dustu: %s", deneme, hata)
            if deneme < DENEME_SAYISI:
                time.sleep(0.6 * deneme)
    raise son_hata


def gorselden_oku(icerik: bytes, mime: str) -> tuple[list[dict], list[str]]:
    """(gecerli_kayitlar, hatalar) dondurur."""
    t0 = time.perf_counter()
    yanit = _modeli_cagir(icerik, mime)
    sure = time.perf_counter() - t0

    kullanim = getattr(yanit, "usage_metadata", None)
    if kullanim is not None:
        logger.info(
            "Gorsel okuma TOKEN girdi=%s cikti=%s sure=%.2fsn",
            getattr(kullanim, "prompt_token_count", "?"),
            getattr(kullanim, "candidates_token_count", "?"),
            sure,
        )

    try:
        ham_liste = _json_ayikla(yanit.text)
    except (json.JSONDecodeError, ValueError):
        logger.exception("Model JSON dondurmedi")
        return [], ["Görseldeki tablo okunamadı, daha net bir görüntü deneyin."]

    kayitlar: list[dict] = []
    hatalar: list[str] = []
    for ham in ham_liste:
        kayit, hata = _kaydi_dogrula(ham)
        if hata:
            hatalar.append(hata)
        else:
            kayitlar.append(kayit)

    logger.info("Gorselden %d varlik okundu, %d satir elendi", len(kayitlar), len(hatalar))
    return kayitlar, hatalar
