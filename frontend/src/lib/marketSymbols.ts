export const CUSTOM_SYMBOL = "__custom__";

export const SYMBOLS_BY_TYPE: Record<string, string[]> = {
  kripto: ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "BNB", "LTC", "MATIC"],
  doviz: ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD"],
  altin: [
    "GRAM_ALTIN",
    "CEYREK_ALTIN",
    "YARIM_ALTIN",
    "TAM_ALTIN",
    "CUMHURIYET_ALTINI",
    "ONS_ALTIN",
    "GUMUS",
  ],
  hisse: [
    "AKBNK",
    "THYAO",
    "ASELS",
    "GARAN",
    "BIMAS",
    "EREGL",
    "KCHOL",
    "SISE",
    "TUPRS",
    "YKBNK",
  ],
  gayrimenkul: ["KONUT", "ARSA", "ISYERI", "TARLA", "DUKKAN"],
  diger: [],
};

export const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  BNB: "binancecoin",
  LTC: "litecoin",
  MATIC: "matic-network",
};

export const GOLD_NAMES: Record<string, string> = {
  GRAM_ALTIN: "Gram Altın",
  CEYREK_ALTIN: "Çeyrek Altın",
  YARIM_ALTIN: "Yarım Altın",
  TAM_ALTIN: "Tam Altın",
  CUMHURIYET_ALTINI: "Cumhuriyet Altını",
  ONS_ALTIN: "ONS Altın",
  GUMUS: "Gümüş",
};

export const REAL_ESTATE_LABELS: Record<string, string> = {
  KONUT: "Konut",
  ARSA: "Arsa",
  ISYERI: "Isyeri",
  TARLA: "Tarla",
  DUKKAN: "Dukkan",
};

export function getSymbolLabel(assetType: string, symbol: string): string {
  if (assetType === "altin") return GOLD_NAMES[symbol] ?? symbol;
  if (assetType === "gayrimenkul") return REAL_ESTATE_LABELS[symbol] ?? symbol;
  return symbol;
}

export function getYahooTicker(assetType: string, symbol: string): string | null {
  if (assetType === "kripto") return `${symbol}-USD`;
  if (assetType === "doviz") return `${symbol}TRY=X`;
  if (assetType === "hisse") return `${symbol}.IS`;
  if (assetType === "altin") {
    if (symbol === "GRAM_ALTIN" || symbol === "ONS_ALTIN") return "GC=F";
    if (symbol === "GUMUS") return "SI=F";
    return null;
  }
  return null;
}

export function getChartCurrencyLabel(assetType: string): string {
  if (assetType === "kripto" || assetType === "altin") return "USD";
  return "TL";
}

export const CHART_CATEGORY_LABELS: Record<string, string> = {
  kripto: "Kripto Para",
  doviz: "Doviz",
  altin: "Altin / Gumus",
  hisse: "Hisse Senedi (BIST)",
};
