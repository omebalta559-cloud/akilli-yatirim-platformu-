export type Lang = "tr" | "en";

// Uygulamanin arayuz metinleri. Turkce varsayilan; Ingilizce istege bagli.
// Yeni metin ceviren her sayfa, anahtarlarini buraya ekler.
export const translations: Record<Lang, Record<string, string>> = {
  tr: {
    // Dil dugmesi (uzerinde gecilecek dili gosterir)
    "lang.switchLabel": "EN",
    "lang.switchTitle": "Switch to English",

    // Navbar
    "nav.blog": "Blog",
    "nav.prices": "Güncel Fiyatlar",
    "nav.charts": "Grafikler",
    "nav.portfolio": "Portföyüm",
    "nav.alerts": "Alarmlar",
    "nav.advisor": "Yatırım Asistanı",
    "nav.logout": "Çıkış Yap",
    "nav.login": "Giriş Yap",
    "nav.register": "Kayıt Ol",
    "nav.menuOpen": "Menüyü aç",
    "nav.menuClose": "Menüyü kapat",

    // Landing hero
    "hero.badge": "Yapay zekâ destekli akıllı portföy platformu",
    "hero.titleLead": "Yatırımlarını tek yerde topla,",
    "hero.titleEmphasis": "akıllıca",
    "hero.titleTail": "yönet.",
    "hero.subtitle":
      "Borsa, kripto, altın, döviz, mevduat… hepsi tek panelde. Yapay zekâ asistanına sor, risk profilini çıkar ve enflasyona göre gerçek getirini gör.",
    "hero.ctaPortfolio": "Portföyüme Git",
    "hero.ctaLogin": "Giriş Yap",
    "hero.disclaimer": "Kredi kartı gerekmez · Ücretsiz kayıt · Türkiye piyasalarına özel",

    // Landing ozellikler bolumu
    "features.title": "Sadece takip değil — akıllı bir portföy asistanı",
    "features.subtitle":
      "Yapay zekâ ve kişisel risk analizi ile yatırımlarını daha bilinçli yönet.",
    "feat.advisor.title": "AI Yatırım Asistanı",
    "feat.advisor.desc":
      "Güncel finans haberlerini ve senin portföyünü bilen yapay zekâya sor; piyasayı, riskleri ve seçenekleri sade bir dille açıklasın.",
    "feat.risk.title": "Risk Profili Analizi",
    "feat.risk.desc":
      "Risk toleransın, vaden ve hedefine göre sana uygun örnek varlık dağılımını (borsa / kripto / altın / döviz) gör.",
    "feat.portfolio.title": "Portföy Takibi",
    "feat.portfolio.desc":
      "Tüm varlıklarını ekle; toplam değerini ve kâr/zararını tek bakışta gör.",
    "feat.alerts.title": "Fiyat Alarmları",
    "feat.alerts.desc":
      "Bir varlık hedef fiyatına ulaştığında anında e-posta ile haberdar ol, fırsatı kaçırma.",
    "feat.livePrices.title": "Canlı Fiyatlar & Grafikler",
    "feat.livePrices.desc":
      "Kripto, döviz, altın ve BIST hisselerinin anlık fiyatları ve geçmiş grafikleri — hepsi güncel.",
    "feat.real.title": "Reel Getiri Takibi",
    "feat.real.desc":
      "Enflasyona göre gerçekte kazandın mı kaybettin mi — nominal değil, alım gücü bazında.",

    // Canli fiyatlar panosu
    "prices.heading": "Canlı piyasa fiyatları",
    "prices.tag": "Altın · Döviz · Kripto · BIST",
    "card.gold": "Altın & Gümüş (TL)",
    "card.forex": "Döviz Kurları",
    "card.crypto": "Kripto (USD)",
    "card.stocks": "Borsa (BIST)",
    "card.funds": "Yatırım Fonları (TL)",
    "common.retry": "Tekrar Dene",
    "common.loading": "Yükleniyor...",
    "error.marketAll":
      "Piyasa verileri yüklenirken bir hata oluştu. Sunucu uyanıyor olabilir, birkaç saniye sonra tekrar deneyin.",
    "error.marketSome":
      "Bazı piyasa verileri şu an alınamadı, diğerleri gösteriliyor. Eksik olanlar için tekrar deneyin.",

    // AI danisman
    "advisor.title": "Yatırım Asistanı",
    "advisor.clearChat": "Sohbeti Temizle",
    "advisor.backToDashboard": "Dashboard'a dön",
    "advisor.disclaimer": "Bu bir yatırım tavsiyesi değildir, genel bilgi amaçlıdır.",
    "advisor.tabRisk": "Risk Profili",
    "advisor.tabChat": "Asistan Sohbeti",
    "advisor.hideHistory": "Geçmişi gizle",
    "advisor.showHistory": "Geçmiş sohbeti göster",
    "advisor.messagesWord": "mesaj",
    "advisor.placeholder": "Sorunu yaz...",
    "advisor.send": "Gönder",
    "advisor.errorGeneric": "Asistan ile iletişim kurulurken bir hata oluştu.",
  },

  en: {
    "lang.switchLabel": "TR",
    "lang.switchTitle": "Türkçeye geç",

    "nav.blog": "Blog",
    "nav.prices": "Prices",
    "nav.charts": "Charts",
    "nav.portfolio": "Portfolio",
    "nav.alerts": "Alerts",
    "nav.advisor": "AI Advisor",
    "nav.logout": "Sign Out",
    "nav.login": "Sign In",
    "nav.register": "Sign Up",
    "nav.menuOpen": "Open menu",
    "nav.menuClose": "Close menu",

    "hero.badge": "AI-powered smart portfolio platform",
    "hero.titleLead": "Track all your investments in one place —",
    "hero.titleEmphasis": "smartly",
    "hero.titleTail": "managed.",
    "hero.subtitle":
      "Stocks, crypto, gold, forex, deposits… all on one dashboard. Ask the AI assistant, find your risk profile, and see your real return adjusted for inflation.",
    "hero.ctaPortfolio": "Go to My Portfolio",
    "hero.ctaLogin": "Sign In",
    "hero.disclaimer": "No credit card required · Free sign-up · Built for Turkish markets",

    "features.title": "Not just tracking — a smart portfolio assistant",
    "features.subtitle":
      "Manage your investments more consciously with AI and personal risk analysis.",
    "feat.advisor.title": "AI Investment Assistant",
    "feat.advisor.desc":
      "Ask an AI that knows current financial news and your portfolio; it explains the market, risks and options in plain language.",
    "feat.risk.title": "Risk Profile Analysis",
    "feat.risk.desc":
      "See a sample asset allocation (stocks / crypto / gold / forex) suited to your risk tolerance, horizon and goals.",
    "feat.portfolio.title": "Portfolio Tracking",
    "feat.portfolio.desc":
      "Add all your assets; see your total value and profit/loss at a glance.",
    "feat.alerts.title": "Price Alerts",
    "feat.alerts.desc":
      "Get an instant email when an asset hits your target price — never miss an opportunity.",
    "feat.livePrices.title": "Live Prices & Charts",
    "feat.livePrices.desc":
      "Real-time prices and historical charts for crypto, forex, gold and BIST stocks — all up to date.",
    "feat.real.title": "Real Return Tracking",
    "feat.real.desc":
      "Did you really gain or lose against inflation — based on purchasing power, not nominal figures.",

    "prices.heading": "Live market prices",
    "prices.tag": "Gold · Forex · Crypto · BIST",
    "card.gold": "Gold & Silver (TRY)",
    "card.forex": "Exchange Rates",
    "card.crypto": "Crypto (USD)",
    "card.stocks": "Stocks (BIST)",
    "card.funds": "Mutual Funds (TRY)",
    "common.retry": "Try Again",
    "common.loading": "Loading...",
    "error.marketAll":
      "An error occurred while loading market data. The server may be waking up; please try again in a few seconds.",
    "error.marketSome":
      "Some market data could not be loaded; the rest is shown. Try again for the missing ones.",

    "advisor.title": "Investment Assistant",
    "advisor.clearChat": "Clear Chat",
    "advisor.backToDashboard": "Back to Dashboard",
    "advisor.disclaimer": "This is not investment advice — for general information only.",
    "advisor.tabRisk": "Risk Profile",
    "advisor.tabChat": "Assistant Chat",
    "advisor.hideHistory": "Hide history",
    "advisor.showHistory": "Show past chat",
    "advisor.messagesWord": "messages",
    "advisor.placeholder": "Type your question...",
    "advisor.send": "Send",
    "advisor.errorGeneric": "An error occurred while communicating with the assistant.",
  },
};
