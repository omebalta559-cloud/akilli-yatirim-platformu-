"""Apollo.io Excel (.xlsx) disa aktarimlarini ayristirir.

Apollo cok fazla sutun uretir; biz sadece iletisim icin gerekli olanlari,
sutun basligina gore (sirasindan bagimsiz) eslestirerek aliriz. Boylece Apollo
sutun sirasini degistirse bile kod calismaya devam eder.
"""

from typing import BinaryIO, Iterator

import openpyxl

# Excel basligi -> Lead alani eslestirmesi. Bir alan icin birden fazla olasi
# baslik varsa ( or. farkli telefon sutunlari) sirayla ilk dolu olan alinir.
_FIELD_HEADERS: dict[str, list[str]] = {
    "first_name": ["First Name"],
    "last_name": ["Last Name"],
    "title": ["Title"],
    "company_name": ["Company Name", "Company Name for Emails"],
    "email": ["Email"],
    "email_status": ["Email Status"],
    "phone": ["Corporate Phone", "Work Direct Phone", "Mobile Phone", "Company Phone", "Other Phone"],
    "linkedin_url": ["Person Linkedin Url"],
    "industry": ["Industry"],
    "city": ["City"],
    "country": ["Country"],
    "website": ["Website"],
}


def _clean(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def parse_leads(file: BinaryIO) -> Iterator[dict[str, str | None]]:
    """xlsx dosyasini akis halinde okuyup her satir icin bir dict uretir.

    read_only=True: 10.000+ satirlik dosyalari bellekte tumden acmadan, satir
    satir okur (Render Free 512MB icin onemli).
    """
    workbook = openpyxl.load_workbook(file, read_only=True, data_only=True)
    try:
        sheet = workbook.active
        rows = sheet.iter_rows(values_only=True)

        try:
            header_row = next(rows)
        except StopIteration:
            return  # bos dosya

        # Baslik metni -> sutun indeksi
        header_index: dict[str, int] = {}
        for idx, name in enumerate(header_row):
            clean_name = _clean(name)
            if clean_name is not None:
                header_index[clean_name] = idx

        # Her Lead alani icin, o alana karsilik gelen sutun indekslerini onceden coz
        field_columns: dict[str, list[int]] = {}
        for field, candidates in _FIELD_HEADERS.items():
            field_columns[field] = [header_index[h] for h in candidates if h in header_index]

        for raw in rows:
            if raw is None:
                continue
            record: dict[str, str | None] = {}
            for field, columns in field_columns.items():
                value: str | None = None
                for col in columns:
                    if col < len(raw):
                        value = _clean(raw[col])
                        if value is not None:
                            break
                record[field] = value

            # Tamamen bos satirlari atla
            if any(v is not None for v in record.values()):
                yield record
    finally:
        workbook.close()
