# Akıllı Portföy

Kripto, döviz, altın/gümüş ve BIST hisselerini tek portföyde toplayan; canlı fiyatlarla değer hesaplayan, fiyat alarmı kuran ve yapay zekâ destekli yorum üreten yatırım takip platformu.

🌐 **Canlı**: [akilli-yatirim-platformu.vercel.app](https://akilli-yatirim-platformu.vercel.app)

---

## Özellikler

- **Çok varlıklı portföy** — kripto, döviz, altın/gümüş, BIST hisseleri tek ekranda
- **Canlı fiyatlar** — CoinGecko ve Yahoo Finance üzerinden, Redis önbellekli
- **Yapay zekâ danışmanı** — Gemini + RAG; portföyünü, son 3 ayın grafiğini ve güncel ekonomi haberlerini birlikte değerlendirir
- **Fiyat alarmları** — hedef fiyata ulaşınca e-posta bildirimi
- **Performans takibi** — günlük otomatik snapshot, zaman içindeki değişim grafiği
- **Rapor çıktısı** — portföyü PDF ve Excel olarak indirme
- **Enflasyon farkındalığı** — getiriler yıllık TÜFE oranıyla birlikte değerlendirilir
- **Kimlik doğrulama** — JWT, Google ile giriş, e-posta ile şifre sıfırlama
- **Blog ve SSS** — SEO uyumlu içerik sayfaları, yapılandırılmış veri

---

## Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic Settings |
| Veritabanı | PostgreSQL (ilişkisel), Redis (önbellek), ChromaDB (vektör, gömülü) |
| Yapay zekâ | Google Gemini, RSS tabanlı RAG |
| Dağıtım | Vercel (frontend), Render + Docker (backend) |

---

## Mimari

```
frontend/    → Next.js arayüz (Vercel)
backend/     → FastAPI servisi (Render, Docker)
keepalive/   → Ana backend'i uyanık tutan yardımcı servis (Render)
```

Backend modüler bir yapıda; her iş alanı kendi `router / service / models / schemas` dörtlüsüne sahip:

```
backend/app/modules/
├── auth/          # JWT + Google ile giriş, şifre sıfırlama
├── market_data/   # CoinGecko + Yahoo Finance fiyatları
├── portfolio/     # Varlıklar, performans, PDF/Excel rapor
├── ai_advisor/    # Gemini + RAG tabanlı danışman
├── alerts/        # Fiyat alarmları ve e-posta bildirimi
└── outreach/      # Toplu e-posta kampanyası
```

### Neden üç veritabanı?

- **PostgreSQL** — kullanıcılar, portföy varlıkları, günlük snapshot'lar, alarmlar
- **Redis** — piyasa verisi önbelleği. Taze veri 30 sn yaşar; dış servis çökerse 6 saate kadar "bayat" yedek döndürülür, böylece kullanıcı hata ekranı yerine son bilinen fiyatı görür
- **ChromaDB** — AI danışmanın haber hafızası. Ayrı sunucu değil, gömülü (embedded) modda diske yazar

---

## Kurulum

Gereksinim: Docker ve Docker Compose.

```bash
git clone https://github.com/omebalta559-cloud/akilli-yatirim-platformu-.git
cd akilli-yatirim-platformu-
cp backend/.env.example backend/.env   # değerleri doldur
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API dokümantasyonu: http://localhost:8000/docs

Veritabanı migration'ları konteyner açılışında `alembic upgrade head` ile otomatik uygulanır.

### Ortam değişkenleri

`backend/.env.example` dosyasındaki tüm anahtarlar `backend/.env` içine kopyalanmalı. Önemli olanlar:

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `REDIS_URL` | Redis bağlantı adresi |
| `CHROMA_PERSIST_DIR` | ChromaDB'nin veri yazacağı dizin |
| `JWT_SECRET` | Token imzalama anahtarı — üretimde mutlaka değiştir |
| `GEMINI_API_KEY` | AI danışman için Google Gemini anahtarı |
| `GOOGLE_CLIENT_ID` | Google ile giriş için OAuth istemci kimliği |
| `BREVO_API_KEY`, `EMAIL_SENDER` | E-posta gönderimi (şifre sıfırlama, alarm bildirimi) |
| `COINGECKO_API_KEY` | Opsiyonel; paylaşımlı IP'lerde rate limit riskini azaltır |
| `ANNUAL_TUFE_RATE` | Güncel yıllık TÜFE oranı (TÜİK) |

> Not: `backend/.env` `.gitignore` içindedir, repoya gönderilmez.

### Testler

```bash
docker compose exec backend pytest
```

---

## Üretim ortamına dair notlar

Proje ücretsiz planlar üzerinde çalışıyor; bu bazı ek çözümler gerektirdi:

- **Render ücretsiz planı 15 dk sonra uyuyor** → `keepalive/` klasöründeki ikinci servis ile ana backend 6–10 dakikada bir karşılıklı ping atarak birbirini uyanık tutuyor
- **Render giden SMTP portlarını (25/465/587) engelliyor** → e-postalar `smtplib` yerine Brevo'nun HTTPS API'si üzerinden gönderiliyor
- **ChromaDB embedding modeli (~79 MB)** her build'de yeniden inmesin diye kalıcı Docker volume'ünde saklanıyor
- **TCMB EVDS API'si** (evds2 → evds3 geçişi nedeniyle) istekleri engellediği için TÜFE oranı konfigürasyondan elle güncelleniyor

Bu kararların ayrıntılı anlatımı: [Sıfırdan Bir Yatırım Platformu — Medium yazısı](https://medium.com/@omebalta559/s%C4%B1f%C4%B1rdan-bir-yat%C4%B1r%C4%B1m-platformu-next-js-fastapi-ve-gemini-ile-ak%C4%B1ll%C4%B1-portf%C3%B6y-bb657f5f5bdf)

---

## Yasal uyarı

Bu platform yatırım danışmanlığı hizmeti değildir. Üretilen yorumlar ve gösterilen veriler yalnızca bilgilendirme amaçlıdır; yatırım kararlarınızın sorumluluğu size aittir.
