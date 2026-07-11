import chromadb
import google.generativeai as genai

from app.core.config import settings

genai.configure(api_key=settings.gemini_api_key)

_collection = None


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        _collection = client.get_or_create_collection(name="finans_haberleri")
    return _collection


def add_news_document(doc_id: str, text: str, metadata: dict | None = None) -> None:
    _get_collection().add(ids=[doc_id], documents=[text], metadatas=[metadata or {}])


def _get_relevant_context(question: str, n_results: int = 5) -> list[str]:
    results = _get_collection().query(query_texts=[question], n_results=n_results)
    documents = results.get("documents") or [[]]
    return documents[0]


def ask_advisor(question: str, portfolio_summary: str = "") -> str:
    context_chunks = _get_relevant_context(question)
    context_text = "\n---\n".join(context_chunks) if context_chunks else "Ilgili guncel haber bulunamadi."

    system_prompt = (
        "Sen bir yatirim danismanisin. Sana verilen guncel finans haberlerini ve "
        "kullanicinin portfoyunu dikkate alarak Turkce, net ve riskleri belirten "
        "tavsiyeler ver. Kesin getiri vaadinde bulunma."
    )
    user_message = (
        f"Guncel haber baglami:\n{context_text}\n\n"
        f"Kullanici portfoyu:\n{portfolio_summary or 'Belirtilmedi'}\n\n"
        f"Soru:\n{question}"
    )

    model = genai.GenerativeModel("gemini-flash-latest", system_instruction=system_prompt)
    response = model.generate_content(user_message)
    return response.text
