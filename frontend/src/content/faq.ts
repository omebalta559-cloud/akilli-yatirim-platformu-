// Sikca Sorulan Sorular (SSS) verisi. Yeni soru eklemek icin ilgili
// kategorinin items dizisine { q, a } eklemek yeterli; /sss sayfasi ve
// FAQ yapilandirilmis verisi (JSON-LD) otomatik guncellenir.

export type FaqItem = { q: string; a: string };
export type FaqCategory = { title: string; items: FaqItem[] };

export const faqCategories: FaqCategory[] = [
  {
    title: "Temel Kavramlar",
    items: [
      {
        q: "Enflasyon nedir?",
        a: `Enflasyon, mal ve hizmet fiyatlarinin genel seviyesinin zaman icinde artmasidir. Enflasyon yukseldikce ayni parayla daha az sey alirsin; yani paranin alim gucu duser. Turkiye gibi yuksek enflasyonlu ekonomilerde, yatirimda "gercek" getiriye bakmak zorunlu hale gelir.`,
      },
      {
        q: "TUFE nedir?",
        a: `TUFE (Tuketici Fiyat Endeksi), hane halkinin tukettigi mal ve hizmet sepetinin fiyat degisimini olcen endekstir. Enflasyon orani genellikle TUFE'nin yillik degisimiyle ifade edilir ve TUIK tarafindan her ay aciklanir.`,
      },
      {
        q: "Reel getiri nedir?",
        a: `Reel getiri, enflasyondan arindirilmis gercek getiridir; yatiriminin alim gucunu ne kadar artirdigini gosterir. Nominal getirin %40 ama enflasyon %52 ise reel getirin negatiftir, yani aslinda deger kaybetmissindir.`,
      },
      {
        q: "Nominal getiri ne demek?",
        a: `Nominal getiri, paranin sayisal olarak ne kadar arttigidir ve enflasyonu hesaba katmaz. 100.000 TL'n 140.000 TL olduysa nominal getirin %40'tir; ama gercek kazancin icin reel getiriye bakman gerekir.`,
      },
      {
        q: "Faiz nedir?",
        a: `Faiz, parayi odunc vermenin ya da mevduatta tutmanin karsiliginda alinan getiridir. Mevduat faizi enflasyonun ustundeyse alim gucun artar; altindaysa reel olarak kaybedersin.`,
      },
      {
        q: "Volatilite (oynaklik) nedir?",
        a: `Volatilite, bir varligin fiyatinin ne kadar dalgalandigini olcer. Yuksek volatilite, fiyatin kisa surede sert inip cikmasi demektir; hem getiri potansiyelini hem de riski artirir.`,
      },
      {
        q: "Bilesik getiri nedir?",
        a: `Bilesik getiri, kazancin da kazanc getirmesidir: getirilerini yeniden yatirdiginda para zamanla ustel olarak buyur. Uzun vadeli yatirimin en guclu avantajlarindan biridir.`,
      },
      {
        q: "Likidite nedir?",
        a: `Likidite, bir varligi hizlica ve deger kaybetmeden nakde cevirebilme kolayligidir. Mevduat cok likittir; gayrimenkul gibi varliklar daha az likittir.`,
      },
    ],
  },
  {
    title: "Yatirima Baslama",
    items: [
      {
        q: "Yatirima nasil baslanir?",
        a: `Once acil durum fonunu ayir, sonra risk profilini ve hedefini belirle, ardindan kucuk ve cesitlendirilmis sekilde basla. Anlamadigin urune yatirim yapma; ogrenerek ilerle. Bu bir yatirim tavsiyesi degildir.`,
      },
      {
        q: "Az parayla yatirim yapilir mi?",
        a: `Evet. Gunumuzde dusuk tutarlarla borsa, fon ve altin gibi araclara erisilebilir. Onemli olan tutarin buyuklugu degil, duzenlilik ve dogru aliskanliktir.`,
      },
      {
        q: "Acil durum fonu nedir?",
        a: `Acil durum fonu, beklenmedik durumlar (is kaybi, saglik gideri) icin kolayca erisebilecegin nakit tampondur; genelde 3-6 aylik giderini karsilamasi onerilir. Yatirima baslamadan once olusturulmasi mantiklidir.`,
      },
      {
        q: "Risk profili nedir?",
        a: `Risk profili, ne kadar dalgalanmaya ve olasi kayba tahammul edebildigini, vadeni ve hedefini tanimlar (dusuk / orta / yuksek). Sana uygun varlik dagilimi buna gore sekillenir.`,
      },
      {
        q: "Ne kadar param olmali yatirima baslamak icin?",
        a: `Net bir alt sinir yoktur; acil durum fonunu ayirdiktan sonra kisa vadede ihtiyacin olmayan kucuk bir tutarla bile baslanabilir. Borcla veya kira/temel gider parasiyla yatirim yapmak risklidir.`,
      },
    ],
  },
  {
    title: "Borsa ve Hisse",
    items: [
      {
        q: "Borsa nedir, nasil calisir?",
        a: `Borsa, sirket hisselerinin ve diger menkul kiymetlerin alinip satildigi organize piyasadir. Bir hisse aldiginda o sirkete kucuk bir ortak olursun; degeri arz-talep ve sirketin performansiyla degisir.`,
      },
      {
        q: "Hisse senedi nedir?",
        a: `Hisse senedi, bir sirketteki ortaklik payini temsil eden menkul kiymettir. Sirket buyur ve kar ederse hissenin degeri ve temettusu seni de etkiler.`,
      },
      {
        q: "Endeks fonu nedir?",
        a: `Endeks fonu, BIST 100 gibi bir endeksi taklit eden ve icinde onlarca sirketi barindiran fondur. Tek tek hisse secmek yerine otomatik cesitlendirme saglar; bireysel yatirimci icin sik onerilen bir baslangictir.`,
      },
      {
        q: "Temettu nedir?",
        a: `Temettu, bir sirketin karindan hissedarlarina dagittigi paydir. Duzenli temettu, hissedeki fiyat artisi disinda ek bir gelir kaynagi olabilir.`,
      },
      {
        q: "BIST 100 nedir?",
        a: `BIST 100, Borsa Istanbul'da islem goren en buyuk ve en likit 100 sirketten olusan ana endekstir. Turkiye borsasinin genel gidisatini temsil eder.`,
      },
    ],
  },
  {
    title: "Altin ve Doviz",
    items: [
      {
        q: "Altin iyi bir yatirim mi?",
        a: `Altin, uzun vadede enflasyona karsi klasik bir korunak olarak gorulur; ancak kisa vadede oynaktir ve her donem reel kazandirmaz. Genelde portfoyun bir kismi icin degerlendirilir.`,
      },
      {
        q: "Gram altin mi ceyrek altin mi almaliyim?",
        a: `Gram altinda iscilik payi genelde daha dusuk oldugu icin deger biriktirmede daha verimlidir; ceyrek altin ise bolunebilir ve pratik olmasiyla one cikar. Sadece yatirim amaciysa gram altin cogu zaman daha mantiklidir.`,
      },
      {
        q: "Dolar veya euro yatirimi mantikli mi?",
        a: `Doviz, TL deger kaybettiginde koruma saglar ama faiz getirmez ve kurun duragan oldugu donemlerde reel olarak eriyebilir. Tek basina degil, cesitlendirilmis bir dagilimin parcasi olarak dusunulur.`,
      },
    ],
  },
  {
    title: "Kripto Para",
    items: [
      {
        q: "Kripto para nedir?",
        a: `Kripto para, merkezi bir otoriteye bagli olmadan blok zinciri teknolojisiyle calisan dijital varliktir (Bitcoin, Ethereum gibi). Yuksek getiri potansiyeli kadar yuksek risk tasir.`,
      },
      {
        q: "Kripto para riskli mi?",
        a: `Evet, kripto cok yuksek volatiliteye sahiptir; kisa surede buyuk deger kayiplari yasanabilir. Genelde portfoyun yalnizca kaybini goze alabilecegin kucuk bir kismiyla degerlendirilmesi onerilir.`,
      },
      {
        q: "Bitcoin nedir?",
        a: `Bitcoin, 2009'da ortaya cikan ilk ve en bilinen kripto paradir. Arzi sinirlidir ve merkezi olmayan bir agda calisir; cok oynak bir varlik olarak kabul edilir.`,
      },
    ],
  },
  {
    title: "Portfoy ve Strateji",
    items: [
      {
        q: "Portfoy cesitlendirme nedir?",
        a: `Portfoy cesitlendirme, parayi farkli davranan birden fazla varliga dagitarak riski azaltmaktir. Biri duserken digeri dengeler; tek bir kotu haberde her seyini kaybetmezsin.`,
      },
      {
        q: "Uzun vade mi kisa vade mi daha iyi?",
        a: `Uzun vade, dalgalanmalarin etkisini azaltir ve bilesik getiriden faydalanmayi saglar. Kisa vadede piyasa tahmini zordur ve risk artar; vaden hedefine gore belirlenir.`,
      },
      {
        q: "Enflasyona karsi ne yapmaliyim?",
        a: `Nakiti eritmemek icin enflasyonu yenme potansiyeli olan araclara cesitlendirilmis sekilde yonelmek ve her varligin reel getirisini izlemek genel bir yaklasimdir. Amac, sadece nominal degil reel olarak kazanmaktir.`,
      },
      {
        q: "Fon nedir?",
        a: `Fon, bircok yatirimcinin parasinin bir havuzda toplanip profesyonelce farkli varliklara yatirildigi bir urundur. Kucuk tutarla cesitlendirme imkani saglar.`,
      },
    ],
  },
  {
    title: "Vergi ve Yasal",
    items: [
      {
        q: "Borsa kazancinda vergi var mi?",
        a: `Hisse ve yatirim araclarinin vergilendirilmesi araca, elde tutma suresine ve guncel mevzuata gore degisir. Kesin ve guncel durum icin resmi kaynaklara veya bir mali musavire basvurmak gerekir.`,
      },
      {
        q: "Kripto kazanci vergilendirilir mi?",
        a: `Kripto varliklarin vergilendirilmesi Turkiye'de gelisen ve degisebilen bir konudur. Guncel yukumlulukler icin resmi duzenlemeleri ve bir uzmani takip etmek en dogrusudur.`,
      },
      {
        q: "Yatirim tavsiyesi almak yasal mi?",
        a: `Kisiye ozel yatirim danismanligi Turkiye'de SPK lisansi gerektiren bir faaliyettir. Lisanssiz kisi veya kaynaklardan gelen "sunu al, sunu sat" tarzi oneriler risklidir; bilgi ile tavsiyeyi ayirmak onemlidir.`,
      },
    ],
  },
];

export const allFaqItems: FaqItem[] = faqCategories.flatMap((c) => c.items);
