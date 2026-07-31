// Blog yazilari burada tutulur. Yeni yazi eklemek icin bu diziye yeni bir
// nesne eklemek yeterli; /blog listesi, /blog/[slug] sayfasi ve sitemap
// otomatik olarak guncellenir. Yazi govdesi, .blog-prose stilleriyle
// bicimlenen basit HTML'dir (bkz. globals.css).

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO tarih (YYYY-MM-DD)
  readingTime: string;
  html: string;
};

export const articles: Article[] = [
  {
    slug: "enflasyona-gore-reel-getiri-nedir",
    title: "Enflasyona Göre Reel Getiri Nedir, Nasıl Hesaplanır?",
    description:
      "Nominal getiri seni yanıltabilir. Reel getiri nedir, Fisher formülüyle nasıl hesaplanır ve gerçek kârın neden bu? Örnekle adım adım anlattık.",
    date: "2026-07-31",
    readingTime: "6 dk okuma",
    html: `
<p class="lead">
  &ldquo;Bu yıl %40 kâr ettim&rdquo; diyorsun ama enflasyon %52 olduysa aslında
  <span class="hl">para kaybettin</span>. Nominal ile reel getiri arasındaki bu fark,
  Türkiye&rsquo;de çoğu yatırımcının gözden kaçırdığı en önemli konu. Bu yazıda reel getirinin
  ne olduğunu, nasıl hesaplandığını ve neden gerçek kârının bu olduğunu adım adım anlatıyoruz.
</p>

<h2>Nominal getiri vs. reel getiri</h2>
<p>
  <strong>Nominal getiri</strong>, paranın sayısal olarak ne kadar arttığıdır. 100.000 TL&rsquo;n
  140.000 TL olduysa nominal getirin %40&rsquo;tır. Kulağa harika geliyor, değil mi?
</p>
<p>
  Ama bir yıl içinde fiyatlar da arttı. <strong>Reel getiri</strong>, enflasyondan arındırılmış
  gerçek getiridir; yani <span class="hl">alım gücünün</span> gerçekte ne kadar değiştiğini gösterir.
  Asıl önemli olan budur.
</p>

<h2>Reel getiri nasıl hesaplanır? (Fisher formülü)</h2>
<p>Reel getiri basit bir formülle hesaplanır:</p>
<blockquote>Reel Getiri = <strong>(1 + Nominal Getiri) &divide; (1 + Enflasyon) &minus; 1</strong></blockquote>
<p>Bir örnekle netleştirelim.</p>

<div class="calc">
  <div class="calc-head">Örnek: 100.000 ₺ yatırdın, 1 yıl sonra&hellip;</div>
  <div class="calc-grid">
    <div class="calc-cell">
      <span class="k">Nominal Getiri</span>
      <span class="v green">+%40</span>
      <span class="n">hesapta böyle görünür</span>
    </div>
    <div class="calc-cell">
      <span class="k">Yıllık Enflasyon</span>
      <span class="v zinc">%52</span>
      <span class="n">aynı dönemde fiyat artışı</span>
    </div>
    <div class="calc-cell hero">
      <span class="k">Gerçek (Reel) Getiri</span>
      <span class="v red">&minus;%8</span>
      <span class="n">alım gücün azaldı</span>
    </div>
  </div>
  <div class="calc-note">
    Hesap: (1 + 0,40) &divide; (1 + 0,52) &minus; 1 = <strong>&minus;0,079 &asymp; &minus;%8</strong>.
    Yani &ldquo;%40 kâr&rdquo; sandığın yatırım, enflasyon sonrası aslında değer kaybetti.
  </div>
</div>

<h2>Neden bu kadar önemli?</h2>
<p>
  Çünkü nominal rakamlara bakarak kendini kârlı sanmak, Türkiye gibi yüksek enflasyonlu bir
  ekonomide en pahalı hatadır. İki farklı yatırım aynı nominal getiriyi verse bile, hangisinin
  alım gücünü koruduğu ancak reel getiriye bakınca anlaşılır.
  <strong>Gerçek performansını görmeden doğru karar veremezsin.</strong>
</p>

<h2>Reel getirini kolayca nasıl takip edersin?</h2>
<p>
  Her varlık için bunu elle hesaplamak yorucu. Bunun yerine tüm yatırımlarını (borsa, kripto,
  altın, döviz, mevduat) tek yere ekleyip, güncel TÜFE&rsquo;ye göre reel getirinin otomatik
  hesaplandığı bir araç kullanabilirsin.
</p>
`.trim(),
  },

  {
    slug: "enflasyona-karsi-yatirim-araclari",
    title: "Enflasyona Karşı En İyi Yatırım Araçları (2026)",
    description:
      "Enflasyon paranı eritirken hangi yatırım araçları alım gücünü korur? Altın, döviz, borsa, endeks ve mevduatı reel getiri açısından karşılaştırdık.",
    date: "2026-07-30",
    readingTime: "7 dk okuma",
    html: `
<p class="lead">
  Enflasyon, hiçbir şey yapmasan bile paranın <span class="hl">alım gücünü her yıl eritir</span>.
  Yastık altındaki 100.000 TL, %50 enflasyonda bir yıl sonra yaklaşık 66.000 TL gibi harcar. Peki
  bu erimeye karşı ne yapmalı? İşte enflasyona karşı öne çıkan yatırım araçları ve artı/eksileri.
</p>

<h2>Enflasyon paranı nasıl eritir?</h2>
<p>
  Fiyatlar arttıkça aynı parayla daha az şey alırsın. Bu yüzden yatırımda asıl soru "kaç lira kazandım"
  değil, <strong>"alım gücüm arttı mı"</strong> olmalıdır. Bir yatırımın enflasyonu yenip yenmediği
  ise ancak reel getiriye bakınca anlaşılır.
</p>

<h2>Öne çıkan araçlar ve artı/eksileri</h2>
<p><strong>Altın:</strong> Klasik enflasyon korunağı. Uzun vadede alım gücünü korumada güçlü, ama kısa vadede oynak olabilir.</p>
<p><strong>Döviz (dolar/euro):</strong> TL değer kaybettikçe korur; ancak faiz getirmez ve kurun sabitlendiği dönemlerde reel olarak eriyebilir.</p>
<p><strong>Borsa (hisse/endeks):</strong> Uzun vadede enflasyonu yenme potansiyeli en yüksek olan sınıf; ama dalgalı ve bilgi ister. Endeks fonları bireysel için daha dengeli.</p>
<p><strong>Mevduat/faiz:</strong> Faiz enflasyonun üstündeyse reel getiri verir, altındaysa (çoğu zaman) alım gücü kaybettirir.</p>
<p><strong>Kripto:</strong> Yüksek getiri potansiyeli ama çok yüksek risk; portföyün küçük bir kısmı için değerlendirilir.</p>

<h2>Asıl mesele: hangisi reel olarak kazandırdı?</h2>
<p>
  Farklı araçlar aynı yılda çok farklı davranır. Nominal getirilerine bakmak yanıltır; enflasyondan
  arındırılmış <span class="hl">reel getiri</span> gerçek resmi verir.
</p>

<div class="calc">
  <div class="calc-head">Örnek: 1 yılda nominal +%40 getiri</div>
  <div class="calc-grid">
    <div class="calc-cell"><span class="k">Nominal Getiri</span><span class="v green">+%40</span><span class="n">hesapta böyle görünür</span></div>
    <div class="calc-cell"><span class="k">Yıllık Enflasyon</span><span class="v zinc">%52</span><span class="n">aynı dönemde</span></div>
    <div class="calc-cell hero"><span class="k">Reel Getiri</span><span class="v red">&minus;%8</span><span class="n">alım gücün azaldı</span></div>
  </div>
  <div class="calc-note">"%40 kazandım" dediğin araç, enflasyon %52 ise aslında değer kaybettirmiş olabilir.</div>
</div>

<h2>Ne yapmalı?</h2>
<p>
  Tek bir araca yüklenmek yerine risk profiline uygun bir dağılım (çeşitlendirme) ve her varlığın
  reel getirisini takip etmek en sağlıklısıdır. Böylece hangi yatırımın gerçekten alım gücünü
  koruduğunu görürsün.
</p>
`.trim(),
  },

  {
    slug: "portfoy-cesitlendirme-nedir",
    title: "Portföy Çeşitlendirme: Riski Nasıl Azaltırsın?",
    description:
      "Tüm yumurtaları tek sepete koymamak neden önemli? Portföy çeşitlendirme nedir, riski nasıl azaltır, nasıl yapılır ve aşırı çeşitlendirme tuzağı.",
    date: "2026-07-29",
    readingTime: "6 dk okuma",
    html: `
<p class="lead">
  "Tüm yumurtaları tek sepete koyma" sözünü duymuşsundur. Yatırımda bunun karşılığı
  <span class="hl">çeşitlendirmedir</span> ve bireysel yatırımcının riskini azaltmasının en
  bilinen yoludur. Peki tam olarak nasıl çalışır?
</p>

<h2>Çeşitlendirme nedir?</h2>
<p>
  Paranı tek bir varlığa değil, birbirinden farklı davranan birden fazla varlığa dağıtmaktır:
  borsa, altın, döviz, mevduat, kripto gibi. Amaç, biri düşerken diğerinin dengelemesidir.
</p>

<h2>Neden riski azaltır?</h2>
<p>
  Farklı varlık sınıfları aynı anda aynı yönde hareket etmez. Borsa düşerken altın yükselebilir,
  TL değer kaybederken döviz korur. Bu <strong>ters ilişki</strong>, portföyünün toplam
  dalgalanmasını azaltır; tek bir kötü haberde her şeyini kaybetmezsin.
</p>

<h2>Nasıl çeşitlendirilir?</h2>
<p>Genel bir çerçeve:</p>
<p><strong>Varlık sınıfına göre:</strong> Borsa + altın + döviz + nakit gibi farklı sınıflar.</p>
<p><strong>Sektöre göre:</strong> Sadece bankacılık değil; teknoloji, sanayi, gıda gibi farklı sektörler.</p>
<p><strong>Vadeye göre:</strong> Kısa vadeli ihtiyaç için nakit, uzun vade için büyüme odaklı varlıklar.</p>

<h2>Aşırı çeşitlendirme tuzağı</h2>
<p>
  Çeşitlendirme iyidir ama abartılırsa portföyün "her şeyden biraz" olur, takip edemezsin ve getiri
  ortalamaya sıkışır. Denge önemli. Ayrıca çeşitlendirme <strong>tek başına yeterli değildir</strong>:
  hepsi enflasyonun altında getiri veriyorsa yine alım gücü kaybedersin. Bu yüzden dağılımı yaparken
  her varlığın <span class="hl">reel getirisini</span> de izlemek gerekir.
</p>

<h2>Kendi dağılımını gör</h2>
<p>
  Portföyünün ne kadar çeşitlendiğini ve hangi varlığın ne kadar ağırlıkta olduğunu görmek, doğru
  kararın ilk adımıdır. Risk profiline uygun örnek bir varlık dağılımı, işe nereden başlayacağını
  gösterir.
</p>
`.trim(),
  },

  {
    slug: "gram-altin-mi-ceyrek-altin-mi",
    title: "Gram Altın mı Çeyrek Altın mı? Hangisi Daha Mantıklı",
    description:
      "Gram altın ile çeyrek altın arasındaki fark nedir, işçilik/makas neyi değiştirir ve yatırım için hangisi daha mantıklı? Reel getiri açısından baktık.",
    date: "2026-07-28",
    readingTime: "5 dk okuma",
    html: `
<p class="lead">
  Altın almaya karar verdin ama <span class="hl">gram mı çeyrek mi</span> diye takıldın mı? İkisi de
  altındır, ama yatırım açısından aralarında önemli bir fark var: işçilik ve alış-satış makası.
</p>

<h2>Aradaki temel fark</h2>
<p>
  <strong>Çeyrek altın</strong> basılı bir ürün olduğu için üzerine <strong>işçilik (baskı) maliyeti</strong>
  biner; alırken biraz fazla ödersin, satarken bu fark geri gelmez. <strong>Gram altın</strong> ise ham
  altına daha yakındır, işçilik payı genelde daha düşüktür.
</p>

<h2>Yatırım için hangisi?</h2>
<p>
  Sadece <strong>değer biriktirmek</strong> istiyorsan gram altın genelde daha verimlidir; işçilik
  kaybın azdır. Çeyrek altının avantajı ise <strong>bölünebilir ve hediye/likidite</strong> açısından
  pratik olmasıdır. Yani "yatırım verimliliği" gram altına, "kullanışlılık" çeyreğe puan verir.
</p>

<h2>Asıl soru: altın enflasyonu yener mi?</h2>
<p>
  Hangisini alırsan al, önemli olan altının <span class="hl">reel getirisidir</span>. Altın fiyatı
  TL bazında %40 arttıysa ama enflasyon %52 ise, altın da o dönem alım gücü kaybettirmiş olabilir.
  Bu yüzden "altın hep kazandırır" varsayımı yerine, dönemsel reel getirisine bakmak gerekir.
</p>

<div class="calc">
  <div class="calc-head">Örnek: altın TL bazında +%40</div>
  <div class="calc-grid">
    <div class="calc-cell"><span class="k">Nominal (TL)</span><span class="v green">+%40</span><span class="n">fiyat böyle arttı</span></div>
    <div class="calc-cell"><span class="k">Enflasyon</span><span class="v zinc">%52</span><span class="n">aynı dönemde</span></div>
    <div class="calc-cell hero"><span class="k">Reel Getiri</span><span class="v red">&minus;%8</span><span class="n">alım gücü açısından</span></div>
  </div>
  <div class="calc-note">Altın bile her dönem reel kazandırmaz; önemli olan enflasyona göre gerçek getiridir.</div>
</div>

<h2>Takip et, tahmin etme</h2>
<p>
  Altınını (gram ya da çeyrek) portföyüne ekleyip reel getirisini takip edersen, "kazandım mı gerçekten"
  sorusunu tahminle değil veriyle cevaplarsın.
</p>
`.trim(),
  },

  {
    slug: "portfoy-takip-nasil-yapilir",
    title: "Yatırımlarını Tek Yerden Nasıl Takip Edersin?",
    description:
      "Borsa, kripto, altın, döviz ve mevduatı dağınık takip etmek yerine tek panelde nasıl izlersin? Excel yöntemi vs uygulama ve reel getiri takibi.",
    date: "2026-07-27",
    readingTime: "6 dk okuma",
    html: `
<p class="lead">
  Paran biraz borsada, biraz kriptoda, biraz altında, biraz mevduatta&hellip; Peki toplamda
  <span class="hl">kâr mı ediyorsun zarar mı</span>? Çoğu yatırımcı bunu net bilmez, çünkü her şey
  dağınık. Oysa yatırım takibi, doğru karar vermenin ilk şartıdır.
</p>

<h2>Neden takip şart?</h2>
<p>
  Neyin kazandırıp neyin kaybettirdiğini görmeden portföyünü iyileştiremezsin. Takip; hangi varlığın
  ağırlıkta olduğunu, toplam kâr/zararını ve —en önemlisi— enflasyona göre gerçek durumunu gösterir.
</p>

<h2>Yöntem 1: Excel ile takip</h2>
<p>
  Bir tablo açıp varlıklarını, adetlerini ve alış fiyatlarını yazabilirsin. Ücretsizdir ama
  <strong>güncel fiyatları elle girmek</strong>, kâr/zararı elle hesaplamak ve enflasyona göre
  düzeltmek yorucudur. Çoğu kişi birkaç hafta sonra bırakır.
</p>

<h2>Yöntem 2: Otomatik uygulama ile takip</h2>
<p>
  Tüm varlıklarını tek yere eklediğin, <strong>güncel fiyatların otomatik çekildiği</strong> ve
  kâr/zararının anlık hesaplandığı bir araç işi kolaylaştırır. Elle uğraşmazsın, her açtığında güncel
  tabloyu görürsün.
</p>

<h2>Farkı yaratan: reel getiri takibi</h2>
<p>
  Asıl değerli olan, sadece nominal kâr/zararı değil, <span class="hl">enflasyona göre reel getiriyi</span>
  de görmektir. "%30 kâr ettim" sandığın portföy, enflasyon sonrası aslında değer kaybediyor olabilir.
  Bunu tek bakışta gösteren bir takip, seni pahalı bir yanılgıdan kurtarır.
</p>

<h2>Nasıl başlarsın?</h2>
<p>
  Varlıklarını bir kez ekle, gerisini araç halletsin: güncel değer, toplam kâr/zarar ve reel getiri
  otomatik hesaplansın. Böylece yatırımının gerçek durumunu her an, tek panelde görürsün.
</p>
`.trim(),
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
