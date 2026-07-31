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
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
