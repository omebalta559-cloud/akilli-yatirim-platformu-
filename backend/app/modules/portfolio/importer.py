"""Portfoy CSV disa aktarimlarini ayristirir.

Araci kurumlarin ve bankalarin sutun basliklari birbirini tutmadigi icin
sutun sirasina degil, basligina bakiyoruz; bir alan icin birden fazla olasi
baslik taniyoruz. Boylece kullanicinin dosyayi elle duzenlemesi gerekmiyor.

Beklenen en az dort alan: varlik turu, sembol, adet, alis fiyati.
"""

import csv
import io
import unicodedata
from typing import Iterator

# Uygulamanin tanidigi varlik turleri (market_data servisiyle ayni).
GECERLI_TURLER = {"kripto", "doviz", "altin", "hisse", "fon", "gayrimenkul"}

# Kullanicilarin dosyalarinda gorulen yaygin yazimlar -> bizim tur adimiz.
_TUR_ESLEME = {
    "kripto": "kripto", "crypto": "kripto", "kriptopara": "kripto", "coin": "kripto",
    "doviz": "doviz", "döviz": "doviz", "currency": "doviz", "fx": "doviz", "parite": "doviz",
    "altin": "altin", "altın": "altin", "gold": "altin", "kiymetlimaden": "altin",
    "hisse": "hisse", "hissesenedi": "hisse", "stock": "hisse", "equity": "hisse", "pay": "hisse",
    "fon": "fon", "yatirimfonu": "fon", "yatırımfonu": "fon", "fund": "fon", "tefas": "fon",
    "gayrimenkul": "gayrimenkul", "emlak": "gayrimenkul", "realestate": "gayrimenkul",
}

# Alan -> taninan sutun basliklari. Sirayla ilk eslesen sutun kullanilir.
_BASLIKLAR: dict[str, list[str]] = {
    "asset_type": ["tur", "tür", "varlikturu", "varlıktürü", "tip", "type", "asset_type", "kategori"],
    "asset_symbol": ["sembol", "symbol", "kod", "code", "varlik", "varlık", "asset", "asset_symbol", "isim", "ad"],
    "quantity": ["adet", "miktar", "quantity", "qty", "lot", "amount", "birim"],
    "purchase_price": ["alisfiyati", "alışfiyatı", "alis", "alış", "fiyat", "price", "purchase_price", "maliyet", "birimfiyat"],
}


def _sadelestir(metin: str) -> str:
    """Baslik ve tur karsilastirmasi icin: kucuk harf, bosluksuz, aksansiz."""
    metin = (metin or "").strip().lower()
    metin = metin.replace("ı", "i").replace("ş", "s").replace("ğ", "g")
    metin = metin.replace("ü", "u").replace("ö", "o").replace("ç", "c")
    metin = unicodedata.normalize("NFKD", metin)
    metin = "".join(k for k in metin if not unicodedata.combining(k))
    return "".join(k for k in metin if k.isalnum())


def _sayiya_cevir(ham: str) -> float | None:
    """'1.234,56' ve '1,234.56' bicimlerinin ikisini de kabul eder."""
    if ham is None:
        return None
    metin = str(ham).strip().replace(" ", "").replace("₺", "").replace("$", "").replace("%", "")
    if not metin:
        return None

    # Hem nokta hem virgul varsa: sonda olan ondalik ayiricidir.
    if "," in metin and "." in metin:
        if metin.rfind(",") > metin.rfind("."):
            metin = metin.replace(".", "").replace(",", ".")
        else:
            metin = metin.replace(",", "")
    elif "," in metin:
        # Tek virgul: ondalik mi binlik mi? Virgulden sonra 3 hane ve
        # baska ayirici yoksa binlik kabul ediyoruz (1,500 -> 1500).
        parcalar = metin.split(",")
        if len(parcalar) == 2 and len(parcalar[1]) == 3 and parcalar[0].isdigit():
            metin = metin.replace(",", "")
        else:
            metin = metin.replace(",", ".")

    try:
        return float(metin)
    except ValueError:
        return None


def _sutun_haritasi(basliklar: list[str]) -> dict[str, int]:
    """Dosyadaki sutun basliklarini bizim alan adlarimiza esler."""
    sade = [_sadelestir(b) for b in basliklar]
    harita: dict[str, int] = {}
    for alan, adaylar in _BASLIKLAR.items():
        for aday in adaylar:
            hedef = _sadelestir(aday)
            if hedef in sade:
                harita[alan] = sade.index(hedef)
                break
    return harita


def satirlari_oku(dosya: io.TextIOBase) -> Iterator[tuple[int, dict | None, str | None]]:
    """(satir_no, kayit, hata) uretir. Kayit varsa hata None, tersi de gecerli."""
    ornek = dosya.read(4096)
    dosya.seek(0)
    try:
        ayirici = csv.Sniffer().sniff(ornek, delimiters=",;\t").delimiter
    except csv.Error:
        ayirici = ";" if ornek.count(";") > ornek.count(",") else ","

    okuyucu = csv.reader(dosya, delimiter=ayirici)
    try:
        basliklar = next(okuyucu)
    except StopIteration:
        return

    harita = _sutun_haritasi(basliklar)
    eksik = [a for a in ("asset_type", "asset_symbol", "quantity", "purchase_price") if a not in harita]
    if eksik:
        yield 1, None, f"Su sutunlar bulunamadi: {', '.join(eksik)}"
        return

    for no, satir in enumerate(okuyucu, start=2):
        if not any((h or "").strip() for h in satir):
            continue

        def al(alan: str) -> str:
            i = harita[alan]
            return satir[i].strip() if i < len(satir) else ""

        tur = _TUR_ESLEME.get(_sadelestir(al("asset_type")))
        if tur is None:
            yield no, None, f"Taninmayan varlik turu: '{al('asset_type')}'"
            continue

        sembol = al("asset_symbol")
        if not sembol:
            yield no, None, "Sembol bos"
            continue

        adet = _sayiya_cevir(al("quantity"))
        fiyat = _sayiya_cevir(al("purchase_price"))
        if adet is None or adet <= 0:
            yield no, None, f"Gecersiz adet: '{al('quantity')}'"
            continue
        if fiyat is None or fiyat <= 0:
            yield no, None, f"Gecersiz alis fiyati: '{al('purchase_price')}'"
            continue

        yield no, {
            "asset_type": tur,
            "asset_symbol": sembol,
            "quantity": adet,
            "purchase_price": fiyat,
        }, None
