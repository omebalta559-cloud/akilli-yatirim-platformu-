import chromadb
from anthropic import Anthropic

from app.core.config import settings

_chroma_client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
_collection = _chroma_client.get_or_create_collection(name="finans_haberleri")
_anthropic_client = Anthropic(api_key=settings.anthropic_api_key)


def add_news_document(doc_id: str, text: str, metadata: dict | None = None) -> None:
    _collection.add(ids=[doc_id], documents=[text], metadatas=[metadata or {}])


def _get_relevant_context(question: str, n_results: int = 5) -> list[str]:
    results = _collection.query(query_texts=[question], n_results=n_results)
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

    response = _anthropic_client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text
