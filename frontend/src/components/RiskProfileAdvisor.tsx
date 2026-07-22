"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, FileText } from "lucide-react";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

// jsPDF'in varsayilan Helvetica fontu WinAnsiEncoding kullanir ve
// Turkce'ye ozgu g, i, S harflerini duzgun gosteremez; bu yuzden PDF'e
// yazilan metinlerde bu harfleri ASCII karsiliklarina ceviriyoruz.
function toPdfSafe(text: string): string {
  return text
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S");
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

const API_URL = getApiUrl();

type RiskLevel = "dusuk" | "orta" | "yuksek";
type Vade = "kisa" | "orta" | "uzun";
type Amac = "koruma" | "gelir" | "buyume";

type Allocation = {
  kripto: number;
  borsa: number;
  altin: number;
  doviz: number;
};

const RISK_OPTIONS: { value: RiskLevel; label: string; description: string }[] = [
  { value: "dusuk", label: "Düşük", description: "Garanti yatırım, sermayemi korumak istiyorum" },
  { value: "orta", label: "Orta", description: "Dengeli, hem büyüme hem güvenlik istiyorum" },
  { value: "yuksek", label: "Yüksek", description: "Agresif, kripto ağırlıklı, riski göze alırım" },
];

const VADE_OPTIONS: { value: Vade; label: string; description: string }[] = [
  { value: "kisa", label: "Kısa Vadeli", description: "0 - 6 Ay" },
  { value: "orta", label: "Orta Vadeli", description: "6 Ay - 2 Yıl" },
  { value: "uzun", label: "Uzun Vadeli", description: "2+ Yıl" },
];

const AMAC_OPTIONS: { value: Amac; label: string; description: string }[] = [
  { value: "koruma", label: "Ana Parayı Korumak", description: "Değer kaybını en aza indirmek" },
  { value: "gelir", label: "Düzenli Gelir", description: "Temettü / faiz gibi periyodik gelir" },
  { value: "buyume", label: "Maksimum Büyüme", description: "Uzun vadede en yüksek getiri" },
];

const ALLOCATION_MATRIX: Record<RiskLevel, Record<Vade, Allocation>> = {
  yuksek: {
    uzun: { kripto: 50, borsa: 30, altin: 10, doviz: 10 },
    orta: { kripto: 40, borsa: 30, altin: 15, doviz: 15 },
    kisa: { kripto: 30, borsa: 30, altin: 20, doviz: 20 },
  },
  orta: {
    uzun: { kripto: 25, borsa: 40, altin: 20, doviz: 15 },
    orta: { kripto: 20, borsa: 35, altin: 25, doviz: 20 },
    kisa: { kripto: 15, borsa: 30, altin: 30, doviz: 25 },
  },
  dusuk: {
    uzun: { kripto: 10, borsa: 25, altin: 35, doviz: 30 },
    orta: { kripto: 5, borsa: 20, altin: 40, doviz: 35 },
    kisa: { kripto: 0, borsa: 20, altin: 40, doviz: 40 },
  },
};

const ASSET_COLORS: Record<keyof Allocation, string> = {
  kripto: "#2a78d6",
  doviz: "#1baf7a",
  altin: "#eda100",
  borsa: "#008300",
};

const ASSET_LABELS: Record<keyof Allocation, string> = {
  kripto: "Kripto",
  doviz: "Döviz",
  altin: "Altın",
  borsa: "Borsa (BIST)",
};

// Yillik iyimser/kotumser getiri varsayimlari (TL bazli, kural tabanli simulasyon).
// Kripto ve Borsa gercek asagi yonlu risk tasir; Altin/Doviz TL bazinda enflasyon/kur
// korumasi sagladigindan kotumser senaryoda bile genelde pozitif kalir.
const ASSET_ANNUAL_RATES: Record<keyof Allocation, { iyimser: number; kotumser: number }> = {
  kripto: { iyimser: 120, kotumser: -35 },
  borsa: { iyimser: 55, kotumser: -15 },
  altin: { iyimser: 35, kotumser: 12 },
  doviz: { iyimser: 30, kotumser: 8 },
};

// Yatirim vadesine gore yillik oranlari olceklendiren carpan (time-scaling factor).
const VADE_CARPANI: Record<Vade, number> = {
  kisa: 0.5,
  orta: 1.0,
  uzun: 2.0,
};

const VADE_BEKLENTI_ETIKETI: Record<Vade, string> = {
  kisa: "6 Aylık",
  orta: "1 Yıllık",
  uzun: "2 Yıllık",
};

function calcScenarioReturn(
  allocation: Allocation,
  vade: Vade,
  scenario: "iyimser" | "kotumser"
): number {
  const vadeCarpani = VADE_CARPANI[vade];
  return (Object.keys(allocation) as (keyof Allocation)[]).reduce((total, key) => {
    const scaledRate = ASSET_ANNUAL_RATES[key][scenario] * vadeCarpani;
    return total + (allocation[key] / 100) * scaledRate;
  }, 0);
}

type FearGreedData = {
  value: number;
  classification: string;
};

const FNG_TR_LABELS: Record<string, string> = {
  "Extreme Fear": "Aşırı Korku",
  Fear: "Korku",
  Neutral: "Nötr",
  Greed: "Açgözlülük",
  "Extreme Greed": "Aşırı Açgözlülük",
};

function getFngColor(value: number): string {
  if (value <= 24) return "#b91c1c";
  if (value <= 44) return "#b45309";
  if (value <= 55) return "#71717a";
  if (value <= 75) return "#34d399";
  return "#047857";
}

function getFngNote(value: number): string {
  if (value < 45) {
    return "Piyasalarda şu an korku hâkim. Bu durum, uzun vadeli yatırımınız için kademeli bir alım fırsatı yaratabilir.";
  }
  if (value <= 55) {
    return "Piyasa dengeli bir seyir izliyor. Mevcut portföy koruma stratejiniz oldukça sağlıklı.";
  }
  return "Piyasalarda yüksek açgözlülük görülüyor. Yeni alımlar yaparken temkinli olmanızı öneririz.";
}

const RISK_LABELS: Record<RiskLevel, string> = { dusuk: "düşük riskli", orta: "orta riskli", yuksek: "yüksek riskli" };
const RISK_PROFILE_STORAGE_LABELS: Record<RiskLevel, string> = {
  dusuk: "Dusuk",
  orta: "Orta",
  yuksek: "Yuksek",
};
const VADE_LABELS: Record<Vade, string> = { kisa: "kısa vadeli", orta: "orta vadeli", uzun: "uzun vadeli" };
const AMAC_LABELS: Record<Amac, string> = {
  koruma: "ana parayı korumaya",
  gelir: "düzenli gelir elde etmeye",
  buyume: "sermayeyi maksimum düzeyde büyütmeye",
};

type LivePrices = {
  gramAltin: number;
  usdTry: number;
  btcTl: number;
  akbnk: number;
};

function getQuantityText(key: keyof Allocation, tlAmount: number, prices: LivePrices): string {
  if (key === "altin") {
    const gram = tlAmount / prices.gramAltin;
    return `Yaklaşık ${gram.toFixed(2)} gram altın alabilirsiniz.`;
  }
  if (key === "doviz") {
    const usd = tlAmount / prices.usdTry;
    return `Yaklaşık ${Math.round(usd).toLocaleString()} dolar (USD) alabilirsiniz.`;
  }
  if (key === "kripto") {
    const btc = tlAmount / prices.btcTl;
    return `Yaklaşık ${btc.toFixed(6)} BTC alabilirsiniz.`;
  }
  const shares = Math.floor(tlAmount / prices.akbnk);
  return `Yaklaşık ${shares.toLocaleString()} adet AKBNK hissesi alabilirsiniz (BIST temsili fiyat).`;
}

function buildAdvisorNote(risk: RiskLevel, vade: Vade, amac: Amac): string {
  const riskText = RISK_LABELS[risk];
  const vadeText = VADE_LABELS[vade];
  const amacText = AMAC_LABELS[amac];

  const riskCumle =
    risk === "yuksek"
      ? "Kripto ve hisse senedi ağırlıklı bu dağılım yüksek getiri potansiyeli taşır ancak fiyat dalgalanmalarına karşı dayanıklı olmanız gerekir."
      : risk === "orta"
        ? "Borsa ağırlıklı ama altın ve dövizle dengelenmiş bu dağılım, büyüme ile güvenlik arasında makul bir denge kurar."
        : "Altın ve döviz ağırlıklı bu dağılım, sermayenizi korumayı ön plana çıkarır; getiri potansiyeli sınırlı ama dalgalanma riski düşüktür.";

  return (
    `Profiliniz ${riskText} ve ${vadeText} bir yatırımcı olarak değerlendirildi; temel hedefiniz ${amacText} yönelik. ` +
    `${riskCumle} Bu dağılım genel bir başlangıç noktasıdır, piyasa koşullarına ve kişisel durumunuza göre yeniden değerlendirilmelidir.`
  );
}

export default function RiskProfileAdvisor() {
  const router = useRouter();
  const [stage, setStage] = useState<"quiz" | "result">("quiz");
  const [risk, setRisk] = useState<RiskLevel | null>(null);
  const [vade, setVade] = useState<Vade | null>(null);
  const [amac, setAmac] = useState<Amac | null>(null);
  const [budget, setBudget] = useState("");
  const [prices, setPrices] = useState<LivePrices | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<"success" | "error" | null>(null);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [fearGreed, setFearGreed] = useState<FearGreedData>({ value: 50, classification: "Neutral" });

  useEffect(() => {
    async function loadFearGreed() {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        if (!res.ok) return;
        const data = await res.json();
        const item = data?.data?.[0];
        if (item) {
          setFearGreed({
            value: Number(item.value),
            classification: item.value_classification,
          });
        }
      } catch {
        /* canli veri alinamazsa varsayilan (50, Neutral) degeri kullanilir */
      }
    }
    loadFearGreed();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 4000;

    async function tryLoadPrices(): Promise<boolean> {
      try {
        const [goldRes, forexRes, cryptoRes, stocksRes] = await Promise.all([
          fetch(`${API_URL}/market/gold`),
          fetch(`${API_URL}/market/forex?base=USD&symbols=TRY`),
          fetch(`${API_URL}/market/crypto?coins=bitcoin`),
          fetch(`${API_URL}/market/stocks?symbols=AKBNK`),
        ]);
        const goldData = await goldRes.json();
        const forexData = await forexRes.json();
        const cryptoData = await cryptoRes.json();
        const stocksData = await stocksRes.json();

        const gramAltin = goldData.result.find(
          (item: { name: string }) => item.name === "Gram Altın"
        )?.selling;
        const usdTry = forexData.rates?.TRY;
        const btcTl = cryptoData.bitcoin?.usd * usdTry;
        const akbnk = stocksData.result?.[0]?.price;

        if (gramAltin && usdTry && btcTl && akbnk) {
          setPrices({ gramAltin, usdTry, btcTl, akbnk });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    async function loadPrices() {
      // Piyasa verisi saglayicilarindan biri gecici olarak (orn. rate limit)
      // basarisiz olursa kullanici sonsuza kadar "yukleniyor" yazisinda
      // takili kalmasin diye birkac kez tekrar deniyoruz.
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        const success = await tryLoadPrices();
        if (success || cancelled) return;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    loadPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  const budgetNumber = Number(budget);
  const canSubmit = risk !== null && vade !== null && amac !== null && budgetNumber > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    if (risk) {
      localStorage.setItem("riskProfile", RISK_PROFILE_STORAGE_LABELS[risk]);
    }
    setStage("result");
  }

  function handleReset() {
    setStage("quiz");
    setRisk(null);
    setVade(null);
    setAmac(null);
    setBudget("");
    setTransferStatus(null);
    setTransferMessage(null);
  }

  async function handleTransferToPortfolio() {
    if (!risk || !vade || !prices || budgetNumber <= 0) return;

    const token = getToken();
    if (!token) {
      setTransferStatus("error");
      setTransferMessage("Portföyünüze aktarmak için önce giriş yapmalısınız.");
      return;
    }

    const allocation = ALLOCATION_MATRIX[risk][vade];
    const items: { asset_type: string; asset_symbol: string; quantity: number; purchase_price: number }[] = [];

    if (allocation.altin > 0) {
      const tl = (allocation.altin / 100) * budgetNumber;
      items.push({
        asset_type: "altin",
        asset_symbol: "GRAM_ALTIN",
        quantity: Number((tl / prices.gramAltin).toFixed(4)),
        purchase_price: prices.gramAltin,
      });
    }
    if (allocation.doviz > 0) {
      const tl = (allocation.doviz / 100) * budgetNumber;
      items.push({
        asset_type: "doviz",
        asset_symbol: "USD",
        quantity: Number((tl / prices.usdTry).toFixed(2)),
        purchase_price: prices.usdTry,
      });
    }
    if (allocation.borsa > 0) {
      const tl = (allocation.borsa / 100) * budgetNumber;
      const shares = Math.floor(tl / prices.akbnk);
      if (shares > 0) {
        items.push({
          asset_type: "hisse",
          asset_symbol: "AKBNK",
          quantity: shares,
          purchase_price: prices.akbnk,
        });
      }
    }
    if (allocation.kripto > 0) {
      const tl = (allocation.kripto / 100) * budgetNumber;
      items.push({
        asset_type: "kripto",
        asset_symbol: "BTC",
        quantity: Number((tl / prices.btcTl).toFixed(8)),
        purchase_price: prices.btcTl,
      });
    }

    if (items.length === 0) return;

    setTransferring(true);
    setTransferStatus(null);
    setTransferMessage(null);
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const res = await fetch(`${API_URL}/portfolio/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error("Portfoye aktarim hatasi:", item, res.status, body);
          }
          return res;
        })
      );
      if (results.some((res) => !res.ok)) {
        throw new Error("Bazı varlıklar aktarılamadı.");
      }
      setTransferStatus("success");
      setTransferMessage(
        "Önerilen sepet başarıyla oluşturuldu ve cüzdanınıza aktarıldı! Portföyüm sayfasına yönlendiriliyorsunuz..."
      );
      setTimeout(() => router.push("/portfolio"), 1600);
    } catch (err) {
      console.error("Portfoye aktarim istisnasi:", err);
      setTransferStatus("error");
      setTransferMessage("Aktarım sırasında bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setTransferring(false);
    }
  }

  async function handleDownloadPDF() {
    if (!risk || !vade || !amac) return;
    setDownloadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");

      const allocation = ALLOCATION_MATRIX[risk][vade];
      const note = buildAdvisorNote(risk, vade, amac);
      const rows = (Object.keys(allocation) as (keyof Allocation)[]).sort(
        (a, b) => allocation[b] - allocation[a]
      );
      const iyimserGetiri = calcScenarioReturn(allocation, vade, "iyimser");
      const kotumserGetiri = calcScenarioReturn(allocation, vade, "kotumser");
      const beklentiEtiketi = VADE_BEKLENTI_ETIKETI[vade];

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 18;
      const contentWidth = pageWidth - marginX * 2;
      let y = 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(42, 120, 214);
      doc.text(toPdfSafe("Akıllı Yatırım Danışmanı"), marginX, y);

      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122);
      doc.text(toPdfSafe(`Kişisel Portföy Raporu - ${new Date().toLocaleDateString("tr-TR")}`), marginX, y);

      y += 5;
      doc.setDrawColor(228, 228, 231);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(113, 113, 122);
      doc.text(toPdfSafe("Sana Özel Portföy Önerisi"), marginX, y);
      y += 7;

      for (const key of rows) {
        const percent = allocation[key];
        const tl = (percent / 100) * budgetNumber;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(63, 63, 70);
        doc.text(toPdfSafe(ASSET_LABELS[key]), marginX, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(113, 113, 122);
        const rightText =
          budgetNumber > 0
            ? `%${percent} . ${tl.toLocaleString(undefined, { maximumFractionDigits: 0 })} TL`
            : `%${percent}`;
        doc.text(rightText, pageWidth - marginX, y, { align: "right" });

        y += 3;
        doc.setFillColor(244, 244, 245);
        doc.roundedRect(marginX, y, contentWidth, 3, 1.5, 1.5, "F");
        if (percent > 0) {
          const [r, g, b] = hexToRgb(ASSET_COLORS[key]);
          doc.setFillColor(r, g, b);
          doc.roundedRect(marginX, y, (contentWidth * percent) / 100, 3, 1.5, 1.5, "F");
        }
        y += 6;

        if (budgetNumber > 0 && prices && percent > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(161, 161, 170);
          doc.text(toPdfSafe(getQuantityText(key, tl, prices)), marginX, y);
          y += 6;
        } else {
          y += 2;
        }
      }

      y += 4;

      const boxWidth = (contentWidth - 6) / 2;
      const boxHeight = 26;
      const drawScenarioBox = (x: number, title: string, value: number, subtitle: string) => {
        doc.setDrawColor(228, 228, 231);
        doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(113, 113, 122);
        doc.text(toPdfSafe(title), x + 4, y + 7);

        const [vr, vg, vb] = value >= 0 ? [5, 150, 105] : [239, 68, 68];
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(vr, vg, vb);
        doc.text(`${value >= 0 ? "+" : ""}${value.toFixed(1)}%`, x + 4, y + 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(161, 161, 170);
        doc.text(toPdfSafe(subtitle), x + 4, y + 22);
      };

      drawScenarioBox(
        marginX,
        `En Yüksek Beklenti (${beklentiEtiketi})`,
        iyimserGetiri,
        "İyimser senaryo, portföy ağırlıklı ortalama"
      );
      drawScenarioBox(
        marginX + boxWidth + 6,
        `En Düşük Beklenti (${beklentiEtiketi})`,
        kotumserGetiri,
        "Kötümser senaryo, portföy ağırlıklı ortalama"
      );
      y += boxHeight + 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const noteLines: string[] = doc.splitTextToSize(toPdfSafe(note), contentWidth - 8);
      const noteHeight = 14 + noteLines.length * 4.5;
      doc.setFillColor(247, 250, 253);
      doc.roundedRect(marginX, y, contentWidth, noteHeight, 2, 2, "F");
      doc.setDrawColor(42, 120, 214);
      doc.setLineWidth(1);
      doc.line(marginX, y, marginX, y + noteHeight);
      doc.setLineWidth(0.2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(42, 120, 214);
      doc.text(toPdfSafe("AKILLI DANIŞMAN NOTU"), marginX + 4, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(63, 63, 70);
      doc.text(noteLines, marginX + 4, y + 13);
      y += noteHeight + 8;

      const disclaimer =
        "Bu öneri kural tabanlı bir simülasyondur, yatırım tavsiyesi değildir. Beklenti aralıkları " +
        "varsayımsal yıllık oranların seçilen vadeye ölçeklenmesiyle hesaplanır, gerçek getiriyi garanti etmez.";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const disclaimerLines: string[] = doc.splitTextToSize(toPdfSafe(disclaimer), contentWidth);
      doc.setTextColor(161, 161, 170);
      doc.text(disclaimerLines, marginX, y);

      doc.save("Yatirim_Portfoy_Raporum.pdf");
    } catch (err) {
      console.error("PDF olusturma hatasi:", err);
      setTransferStatus("error");
      setTransferMessage("PDF oluşturulurken bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (stage === "result" && risk && vade && amac) {
    const allocation = ALLOCATION_MATRIX[risk][vade];
    const note = buildAdvisorNote(risk, vade, amac);
    const rows = (Object.keys(allocation) as (keyof Allocation)[]).sort(
      (a, b) => allocation[b] - allocation[a]
    );
    const iyimserGetiri = calcScenarioReturn(allocation, vade, "iyimser");
    const kotumserGetiri = calcScenarioReturn(allocation, vade, "kotumser");
    const beklentiEtiketi = VADE_BEKLENTI_ETIKETI[vade];

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-500">Sana Özel Portföy Önerisi</h2>
            <button onClick={handleReset} className="text-sm font-medium text-zinc-500 hover:underline">
              Testi Tekrar Yap
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {rows.map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {ASSET_LABELS[key]}
                  </span>
                  <span className="text-zinc-500">
                    %{allocation[key]}
                    {budgetNumber > 0 && (
                      <>
                        {" "}
                        &middot;{" "}
                        {((allocation[key] / 100) * budgetNumber).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        TL
                      </>
                    )}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${allocation[key]}%`, backgroundColor: ASSET_COLORS[key] }}
                  />
                </div>
                {budgetNumber > 0 && prices && allocation[key] > 0 && (
                  <p className="text-xs text-zinc-400">
                    {getQuantityText(key, (allocation[key] / 100) * budgetNumber, prices)}
                  </p>
                )}
              </div>
            ))}
          </div>
          {budgetNumber > 0 && !prices && (
            <p className="mt-3 text-xs text-zinc-400">
              Miktar hesabı için canlı fiyatlar yükleniyor...
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-zinc-500">
              En Yüksek Beklenti ({beklentiEtiketi})
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {iyimserGetiri >= 0 ? "+" : ""}
              {iyimserGetiri.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-zinc-400">İyimser senaryo, portföy ağırlıklı ortalama</p>
          </div>
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-zinc-500">
              En Düşük Beklenti ({beklentiEtiketi})
            </p>
            <p className={`mt-1 text-2xl font-semibold ${kotumserGetiri >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {kotumserGetiri >= 0 ? "+" : ""}
              {kotumserGetiri.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-zinc-400">Kötümser senaryo, portföy ağırlıklı ortalama</p>
          </div>
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-zinc-500">Piyasa Korku &amp; Açgözlülük (Canlı)</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-2xl font-semibold"
                style={{ color: getFngColor(fearGreed.value) }}
              >
                {fearGreed.value}
              </span>
              <span className="text-sm font-medium text-zinc-500">
                {fearGreed.classification}
                {FNG_TR_LABELS[fearGreed.classification] &&
                  ` / ${FNG_TR_LABELS[fearGreed.classification]}`}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Küresel piyasa duyarlılığı ve oynaklık endeksi
            </p>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-[#2a78d6] bg-[#f7fafd] p-5 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2a78d6]">
            Akıllı Danışman Notu
          </p>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{note}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-1 text-xs font-semibold text-zinc-500">Piyasa Durumu Yorumu</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{getFngNote(fearGreed.value)}</p>
        </div>

        <p className="text-xs text-zinc-400">
          Bu öneri kural tabanlı bir simülasyondur, yatırım tavsiyesi değildir. Beklenti aralıkları
          varsayımsal yıllık oranların seçilen vadeye ölçeklenmesiyle hesaplanır, gerçek getiriyi
          garanti etmez.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleTransferToPortfolio}
            disabled={transferring || !prices}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-6 text-sm font-medium text-white shadow-lg transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" strokeWidth={2.5} />
            {transferring
              ? "Aktarılıyor..."
              : !prices
                ? "Fiyatlar yükleniyor..."
                : "Önerilen Sepeti Portföyüme Aktar"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 py-3 px-6 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileText className="h-4 w-4" strokeWidth={2.5} />
            {downloadingPdf ? "Hazırlanıyor..." : "Raporu PDF Olarak İndir"}
          </button>
        </div>

        {transferMessage && (
          <p
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              transferStatus === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {transferMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <QuizCard
        title="Risk Toleransınız"
        options={RISK_OPTIONS}
        selected={risk}
        onSelect={setRisk}
      />
      <QuizCard
        title="Yatırım Vadeniz"
        options={VADE_OPTIONS}
        selected={vade}
        onSelect={setVade}
      />
      <QuizCard
        title="Yatırım Amacınız"
        options={AMAC_OPTIONS}
        selected={amac}
        onSelect={setAmac}
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Yatırım Bütçeniz
        </h3>
        <input
          type="number"
          min={0}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Örnek: 100000"
          className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#2a78d6] dark:border-zinc-800 dark:text-zinc-50"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Portföyümü Oluştur
      </button>
    </div>
  );
}

function QuizCard<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { value: T; label: string; description: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-[#2a78d6] bg-[#eef4fa] dark:bg-zinc-900"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {option.label}
              </span>
              <span className="text-xs text-zinc-500">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
