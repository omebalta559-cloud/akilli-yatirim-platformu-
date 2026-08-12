import asyncio
import hashlib
import logging
import time

import chromadb
import feedparser
import google.generativeai as genai

from app.core.config import settings
from app.core.decorators import log_calls
from app.modules.market_data import service as market_data_service

genai.configure(api_key=settings.gemini_api_key)

logger = logging.getLogger(__name__)

_collection = None

NEWS_RSS_FEEDS = [
    "https://www.bloomberght.com/rss",
    "https://www.aa.com.tr/tr/rss/default?cat=ekonomi",
    "https://www.dunya.com/rss",
    "https://www.ntv.com.tr/ekonomi.rss",
    "https://www.hurriyet.com.tr/rss/ekonomi",
]

GOLD_SILVER_TICKERS = {
    "GRAM_ALTIN": "GC=F",
    "ONS_ALTIN": "GC=F",
    "GUMUS": "SI=F",
}


def get_yahoo_ticker(asset_type: str, symbol: str) -> str | None:
    if asset_type == "kripto":
        return f"{symbol}-USD"
    if asset_type == "doviz":
        return f"{symbol}TRY=X"
    if asset_type in ("hisse", "gayrimenkul"):
        return f"{symbol}.IS"
    if asset_type == "altin":
        return GOLD_SILVER_TICKERS.get(symbol)
    return None


async def _build_holding_line(h) -> str:
    ticker = get_yahoo_ticker(h.asset_type, h.asset_symbol)
    if not ticker:
        return (
            f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
            "grafik verisi mevcut degil"
        )
    try:
        history = await market_data_service.get_price_history(ticker, "3mo", "1d")
        points = history.get("points", [])
        if len(points) >= 2:
            first_price = points[0]["price"]
            last_price = points[-1]["price"]
            change_pct = (last_price - first_price) / first_price * 100
            return (
                f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
                f"son 3 ayin grafigine gore guncel referans fiyat {last_price:.2f}, "
                f"3 aylik degisim %{change_pct:.1f}"
            )
        return (
            f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
            "yeterli grafik verisi yok"
        )
    except Exception:
        return (
            f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
            "grafik verisi su an alinamadi"
        )


async def build_portfolio_chart_context(holdings: list) -> str:
    if not holdings:
        return "Kullanicinin portfoyunde varlik yok."

    # Her varligin fiyat gecmisini sirayla degil, ayni anda (paralel) cekiyoruz -
    # 5 varlik icin 5 istegin toplami yerine en yavas istek kadar sure alir.
    lines = await asyncio.gather(*(_build_holding_line(h) for h in holdings))
    return "\n".join(lines)


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        _collection = client.get_or_create_collection(name="finans_haberleri")
    return _collection


def add_news_document(doc_id: str, text: str, metadata: dict | None = None) -> None:
    _get_collection().upsert(ids=[doc_id], documents=[text], metadatas=[metadata or {}])


def refresh_news_from_rss() -> int:
    added = 0
    for feed_url in NEWS_RSS_FEEDS:
        # Her kaynak ayri try/except icinde: biri (siteye ulasilamama, bozuk
        # RSS vb.) basarisiz olsa bile diger kaynaklar islenmeye devam eder.
        try:
            parsed = feedparser.parse(feed_url)
            feed_added = 0
            for entry in parsed.entries[:20]:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                link = entry.get("link", "")
                if not title:
                    continue
                text = f"{title}\n{summary}"
                doc_id = hashlib.sha1(link.encode() if link else text.encode()).hexdigest()
                add_news_document(doc_id, text, {"source": feed_url, "link": link, "title": title})
                added += 1
                feed_added += 1
            logger.info("RSS kaynagi islendi: %s (%d haber)", feed_url, feed_added)
        except Exception:
            logger.warning("RSS kaynagi islenemedi, atlaniyor: %s", feed_url, exc_info=True)
    return added


def _get_relevant_context(question: str, n_results: int = 5) -> list[str]:
    results = _get_collection().query(query_texts=[question], n_results=n_results)
    documents = results.get("documents") or [[]]
    return documents[0]


@log_calls
def ask_advisor(
    question: str,
    portfolio_summary: str = "",
    chart_context: str = "",
    conversation_history: str = "",
    lang: str = "tr",
) -> str:
    t0 = time.perf_counter()
    context_chunks = _get_relevant_context(question)
    logger.info("ChromaDB baglam aramasi: %.2f sn", time.perf_counter() - t0)
    context_text = "\n---\n".join(context_chunks) if context_chunks else "Ilgili guncel haber bulunamadi."

    if lang == "en":
        system_prompt = (
            "You are an investment INFORMATION assistant (you are NOT an investment advisor). "
            "ONLY answer questions about investing, finance, economy, markets and the user's portfolio. "
            "If a question outside these topics comes up (e.g. recipes, weather, coding, small talk), "
            "do not answer it; politely say you can only help with finance and investment topics and "
            "steer the user back to that. "
            "Considering the current financial news, the user's portfolio, the 3-month price chart trend "
            "of their assets and the previous conversation, provide GENERAL INFORMATION in English, "
            "clearly stating the risks. "
            "Do NOT give personalized 'buy this' / 'sell that' advice; instead explain the options, risks "
            "and points to watch out for. "
            "If there is prior conversation, keep its context and don't repeat the same info unless asked again. "
            "If chart trend data is available, include it (e.g. 'according to the chart it rose/fell over the last 3 months'). "
            "Do not promise guaranteed returns. "
            "If clear guidance about an investment decision is requested, briefly remind that this is not "
            "investment advice and a licensed professional should be consulted. "
            "Keep your answers SHORT and concise: at most 3-4 sentences or 3-4 bullet points. "
            "Avoid long headings, subheadings and lengthy explanations. "
            "If the user wants more detail, you can expand then."
        )
    else:
        system_prompt = (
            "Sen bir yatirim BILGILENDIRME asistanisin (yatirim danismani DEGILSIN). "
            "SADECE yatirim, finans, ekonomi, piyasalar ve kullanicinin portfoyu ile ilgili "
            "sorulari yanitla. Bu konularin disinda (or. yemek tarifi, hava durumu, kod yazma, "
            "genel sohbet vb.) bir soru gelirse cevaplama; kibarca yalnizca finans ve yatirim "
            "konularinda yardimci olabilecegini soyle ve kullaniciyi bu konuya yonlendir. "
            "Sana verilen guncel finans haberlerini, kullanicinin portfoyunu, varliklarin "
            "son 3 aylik fiyat grafigi trendini ve onceki konusma gecmisini dikkate alarak "
            "Turkce, net ve riskleri belirten GENEL BILGILENDIRME yap. "
            "Kisiye ozel 'sunu al', 'sunu sat' seklinde yatirim tavsiyesi VERME; bunun yerine "
            "secenekleri, riskleri ve dikkat edilmesi gereken noktalari acikla. "
            "Onceki konusma varsa baglamini koru, tekrar sorulmadikca ayni bilgiyi tekrarlama. "
            "Grafik trend verisi varsa yorumuna dahil et (orn. 'grafige gore son 3 ayda yukseldi/dustu'). "
            "Kesin getiri vaadinde bulunma. "
            "Yatirim kararlariyla ilgili net bir yonlendirme istenirse, bunun yatirim tavsiyesi "
            "olmadigini ve yetkili bir uzmana danisilmasi gerektigini kisaca hatirlat. "
            "Cevaplarini KISA ve OZ tut: en fazla 3-4 cumle veya 3-4 madde. "
            "Uzun basliklar, alt basliklar ve genis aciklamalar kullanma. "
            "Kullanici daha fazla detay isterse o zaman genisletebilirsin."
        )
    user_message = (
        f"Onceki konusma gecmisi:\n{conversation_history or 'Yok, bu ilk soru.'}\n\n"
        f"Guncel haber baglami:\n{context_text}\n\n"
        f"Kullanici portfoyu:\n{portfolio_summary or 'Belirtilmedi'}\n\n"
        f"Portfoydeki varliklarin grafik/fiyat trend bilgisi:\n{chart_context or 'Mevcut degil'}\n\n"
        f"Soru:\n{question}"
    )

    model = genai.GenerativeModel("gemini-flash-latest", system_instruction=system_prompt)
    t0 = time.perf_counter()
    response = model.generate_content(user_message)
    logger.info("Gemini cevap uretme: %.2f sn", time.perf_counter() - t0)
    return response.text
