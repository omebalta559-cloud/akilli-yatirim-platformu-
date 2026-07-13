import hashlib

import chromadb
import feedparser
import google.generativeai as genai

from app.core.config import settings
from app.modules.market_data import service as market_data_service

genai.configure(api_key=settings.gemini_api_key)

_collection = None

NEWS_RSS_FEEDS = [
    "https://www.bloomberght.com/rss",
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


async def build_portfolio_chart_context(holdings: list) -> str:
    if not holdings:
        return "Kullanicinin portfoyunde varlik yok."

    lines = []
    for h in holdings:
        ticker = get_yahoo_ticker(h.asset_type, h.asset_symbol)
        if not ticker:
            lines.append(
                f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
                "grafik verisi mevcut degil"
            )
            continue
        try:
            history = await market_data_service.get_price_history(ticker, "3mo", "1d")
            points = history.get("points", [])
            if len(points) >= 2:
                first_price = points[0]["price"]
                last_price = points[-1]["price"]
                change_pct = (last_price - first_price) / first_price * 100
                lines.append(
                    f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
                    f"son 3 ayin grafigine gore guncel referans fiyat {last_price:.2f}, "
                    f"3 aylik degisim %{change_pct:.1f}"
                )
            else:
                lines.append(
                    f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
                    "yeterli grafik verisi yok"
                )
        except Exception:
            lines.append(
                f"- {h.asset_symbol} ({h.asset_type}): {h.quantity} adet, alis fiyati {h.purchase_price}, "
                "grafik verisi su an alinamadi"
            )
    return "\n".join(lines)


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        _collection = client.get_or_create_collection(name="finans_haberleri")
    return _collection


def add_news_document(doc_id: str, text: str, metadata: dict | None = None) -> None:
    _get_collection().upsert(ids=[doc_id], documents=[text], metadatas=[metadata or {}])


def refresh_news_from_rss() -> int:
    added = 0
    for feed_url in NEWS_RSS_FEEDS:
        parsed = feedparser.parse(feed_url)
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
    return added


def _get_relevant_context(question: str, n_results: int = 5) -> list[str]:
    results = _get_collection().query(query_texts=[question], n_results=n_results)
    documents = results.get("documents") or [[]]
    return documents[0]


def ask_advisor(
    question: str, portfolio_summary: str = "", chart_context: str = ""
) -> str:
    context_chunks = _get_relevant_context(question)
    context_text = "\n---\n".join(context_chunks) if context_chunks else "Ilgili guncel haber bulunamadi."

    system_prompt = (
        "Sen bir yatirim danismanisin. Sana verilen guncel finans haberlerini, "
        "kullanicinin portfoyunu ve varliklarin son 3 aylik fiyat grafigi trendini "
        "dikkate alarak Turkce, net ve riskleri belirten tavsiyeler ver. "
        "Grafik trend verisi varsa yorumuna dahil et (orn. 'grafige gore son 3 ayda yukseldi/dustu'). "
        "Kesin getiri vaadinde bulunma. "
        "Cevaplarini KISA ve OZ tut: en fazla 3-4 cumle veya 3-4 madde. "
        "Uzun basliklar, alt basliklar ve genis aciklamalar kullanma. "
        "Kullanici daha fazla detay isterse o zaman genisletebilirsin."
    )
    user_message = (
        f"Guncel haber baglami:\n{context_text}\n\n"
        f"Kullanici portfoyu:\n{portfolio_summary or 'Belirtilmedi'}\n\n"
        f"Portfoydeki varliklarin grafik/fiyat trend bilgisi:\n{chart_context or 'Mevcut degil'}\n\n"
        f"Soru:\n{question}"
    )

    model = genai.GenerativeModel("gemini-flash-latest", system_instruction=system_prompt)
    response = model.generate_content(user_message)
    return response.text
