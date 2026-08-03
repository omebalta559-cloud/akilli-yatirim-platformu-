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

  {
    slug: "en-cok-sorulan-finans-sorulari",
    title: "En Çok Sorulan 50 Finans Sorusu ve Cevapları",
    description:
      "Enflasyon, reel getiri, borsa, altın, kripto, portföy, ekonomi ve vergi hakkında en çok sorulan 50 finans sorusunun kısa, tarafsız cevapları. Sorunu seç, cevabını gör.",
    date: "2026-07-31",
    readingTime: "50 soru",
    html: `
<p class="lead">
  Yatırıma yeni başlayanların en çok sorduğu 30 finans sorusunu ve sade cevaplarını bir araya
  getirdik. Aşağıdaki başlıklardan sorunun kategorisine atla, sadece <span class="hl">merak ettiğin
  soruya tıkla</span>, cevabı açılsın.
</p>

<div class="toc">
  <a href="#temel">Temel Kavramlar</a>
  <a href="#baslama">Yatırıma Başlama</a>
  <a href="#borsa">Borsa &amp; Hisse</a>
  <a href="#altin">Altın &amp; Döviz</a>
  <a href="#kripto">Kripto</a>
  <a href="#portfoy">Portföy &amp; Strateji</a>
  <a href="#ekonomi">Ekonomi &amp; Piyasa</a>
  <a href="#vergi">Vergi &amp; Yasal</a>
</div>

<h2 id="temel">Temel Kavramlar</h2>
<details><summary>Enflasyon nedir?</summary><p>Enflasyon, mal ve hizmet fiyatlarının genel seviyesinin zaman içinde artmasıdır. Enflasyon yükseldikçe aynı parayla daha az şey alırsın; yani paranın alım gücü düşer. Türkiye gibi yüksek enflasyonlu ekonomilerde, yatırımda &ldquo;gerçek&rdquo; getiriye bakmak zorunlu hale gelir.</p></details>
<details><summary>TÜFE nedir?</summary><p>TÜFE (Tüketici Fiyat Endeksi), hane halkının tükettiği mal ve hizmet sepetinin fiyat değişimini ölçen endekstir. Enflasyon oranı genellikle TÜFE&rsquo;nin yıllık değişimiyle ifade edilir ve TÜİK tarafından her ay açıklanır.</p></details>
<details><summary>Reel getiri nedir?</summary><p>Reel getiri, enflasyondan arındırılmış gerçek getiridir; yatırımının alım gücünü ne kadar artırdığını gösterir. Nominal getirin %40 ama enflasyon %52 ise reel getirin negatiftir, yani aslında değer kaybetmişsindir.</p></details>
<details><summary>Nominal getiri ne demek?</summary><p>Nominal getiri, paranın sayısal olarak ne kadar arttığıdır ve enflasyonu hesaba katmaz. 100.000 TL&rsquo;n 140.000 TL olduysa nominal getirin %40&rsquo;tır; ama gerçek kazancın için reel getiriye bakman gerekir.</p></details>
<details><summary>Faiz nedir?</summary><p>Faiz, parayı ödünç vermenin ya da mevduatta tutmanın karşılığında alınan getiridir. Mevduat faizi enflasyonun üstündeyse alım gücün artar; altındaysa reel olarak kaybedersin.</p></details>
<details><summary>Volatilite (oynaklık) nedir?</summary><p>Volatilite, bir varlığın fiyatının ne kadar dalgalandığını ölçer. Yüksek volatilite, fiyatın kısa sürede sert inip çıkması demektir; hem getiri potansiyelini hem de riski artırır.</p></details>
<details><summary>Bileşik getiri nedir?</summary><p>Bileşik getiri, kazancın da kazanç getirmesidir: getirilerini yeniden yatırdığında para zamanla üstel olarak büyür. Uzun vadeli yatırımın en güçlü avantajlarından biridir.</p></details>
<details><summary>Likidite nedir?</summary><p>Likidite, bir varlığı hızlıca ve değer kaybetmeden nakde çevirebilme kolaylığıdır. Mevduat çok likittir; gayrimenkul gibi varlıklar daha az likittir.</p></details>
<details><summary>Deflasyon nedir?</summary><p>Deflasyon, enflasyonun tersidir: fiyatların genel seviyesinin düşmesidir. Kulağa iyi gelse de uzun süreli deflasyon, harcamaların ertelenmesine ve ekonomik durgunluğa yol açabilir.</p></details>
<details><summary>Resesyon (durgunluk) nedir?</summary><p>Resesyon, ekonominin belirli bir süre boyunca küçülmesidir (genelde üst üste iki çeyrek daralma). İşsizlik artar, şirket kârları düşer; piyasalar bu dönemlerde daha oynak olur.</p></details>
<details><summary>Merkez Bankası faiz kararı neden önemli?</summary><p>Merkez Bankası, faiz oranını değiştirerek enflasyonu ve ekonomik aktiviteyi etkiler. Faiz kararları; mevduat, kredi, döviz ve borsa üzerinde doğrudan etki yaptığı için yatırımcılar yakından izler.</p></details>

<h2 id="baslama">Yatırıma Başlama</h2>
<details><summary>Yatırıma nasıl başlanır?</summary><p>Önce acil durum fonunu ayır, sonra risk profilini ve hedefini belirle, ardından küçük ve çeşitlendirilmiş şekilde başla. Anlamadığın ürüne yatırım yapma; öğrenerek ilerle. Bu bir yatırım tavsiyesi değildir.</p></details>
<details><summary>Az parayla yatırım yapılır mı?</summary><p>Evet. Günümüzde düşük tutarlarla borsa, fon ve altın gibi araçlara erişilebilir. Önemli olan tutarın büyüklüğü değil, düzenlilik ve doğru alışkanlıktır.</p></details>
<details><summary>Acil durum fonu nedir?</summary><p>Beklenmedik durumlar (iş kaybı, sağlık gideri) için kolayca erişebileceğin nakit tampondur; genelde 3-6 aylık giderini karşılaması önerilir. Yatırıma başlamadan önce oluşturulması mantıklıdır.</p></details>
<details><summary>Risk profili nedir?</summary><p>Risk profili, ne kadar dalgalanmaya ve olası kayba tahammül edebildiğini, vadeni ve hedefini tanımlar (düşük / orta / yüksek). Sana uygun varlık dağılımı buna göre şekillenir.</p></details>
<details><summary>Yatırım ile tasarruf arasındaki fark nedir?</summary><p>Tasarruf, parayı güvenli ve erişilebilir tutmaktır (mevduat, nakit). Yatırım ise getiri elde etmek için parayı risk alarak değerlendirmektir. İkisi birbirini tamamlar: önce tasarruf ve acil fon, sonra yatırım.</p></details>
<details><summary>Piyasa zamanlaması yapılabilir mi (ne zaman al-sat)?</summary><p>Piyasanın dibini ya da tepesini tutturmak çok zordur; profesyoneller bile çoğu zaman başaramaz. Bu yüzden bireysel yatırımcıya genelde düzenli ve uzun vadeli yaklaşım önerilir. Bu bir yatırım tavsiyesi değildir.</p></details>

<h2 id="borsa">Borsa &amp; Hisse</h2>
<details><summary>Borsa nedir, nasıl çalışır?</summary><p>Borsa, şirket hisselerinin ve diğer menkul kıymetlerin alınıp satıldığı organize piyasadır. Bir hisse aldığında o şirkete küçük bir ortak olursun; değeri arz-talep ve şirketin performansıyla değişir.</p></details>
<details><summary>Hisse senedi nedir?</summary><p>Hisse senedi, bir şirketteki ortaklık payını temsil eden menkul kıymettir. Şirket büyür ve kâr ederse hissenin değeri ve temettüsü seni de etkiler.</p></details>
<details><summary>Endeks fonu nedir?</summary><p>Endeks fonu, BIST 100 gibi bir endeksi taklit eden ve içinde onlarca şirketi barındıran fondur. Tek tek hisse seçmek yerine otomatik çeşitlendirme sağlar; bireysel yatırımcı için sık önerilen bir başlangıçtır.</p></details>
<details><summary>Temettü nedir?</summary><p>Temettü, bir şirketin kârından hissedarlarına dağıttığı paydır. Düzenli temettü, hissedeki fiyat artışı dışında ek bir gelir kaynağı olabilir.</p></details>
<details><summary>BIST 100 nedir?</summary><p>BIST 100, Borsa İstanbul&rsquo;da işlem gören en büyük ve en likit 100 şirketten oluşan ana endekstir. Türkiye borsasının genel gidişatını temsil eder.</p></details>
<details><summary>Halka arz (IPO) nedir?</summary><p>Halka arz, bir şirketin hisselerini ilk kez borsada halka açması ve yatırımcılara satmasıdır. Yeni yatırım fırsatı sunar ama her halka arz kazandırmaz; şirketi incelemek gerekir.</p></details>
<details><summary>Boğa ve ayı piyasası ne demek?</summary><p>Boğa piyasası (bull), fiyatların genel olarak yükseldiği iyimser dönemdir; ayı piyasası (bear) ise düşüşün hâkim olduğu karamsar dönemdir. İsimler, hayvanların saldırı yönünden gelir.</p></details>
<details><summary>Lot nedir?</summary><p>Lot, borsada işlem gören en küçük miktar birimidir. Türkiye borsasında genelde 1 lot, 1 adet hisse anlamına gelir.</p></details>
<details><summary>Borsada nasıl işlem yapılır?</summary><p>Borsada işlem yapmak için bir aracı kurumda (banka veya yatırım kuruluşu) yatırım hesabı açman gerekir. Hesaptan alım-satım emirleri vererek hisse, fon gibi ürünlere yatırım yaparsın.</p></details>

<h2 id="altin">Altın &amp; Döviz</h2>
<details><summary>Altın iyi bir yatırım mı?</summary><p>Altın, uzun vadede enflasyona karşı klasik bir korunak olarak görülür; ancak kısa vadede oynaktır ve her dönem reel kazandırmaz. Genelde portföyün bir kısmı için değerlendirilir.</p></details>
<details><summary>Gram altın mı çeyrek altın mı almalıyım?</summary><p>Gram altında işçilik payı genelde daha düşük olduğu için değer biriktirmede daha verimlidir; çeyrek altın ise bölünebilir ve pratik olmasıyla öne çıkar. Sadece yatırım amacıysa gram altın çoğu zaman daha mantıklıdır.</p></details>
<details><summary>Dolar veya euro yatırımı mantıklı mı?</summary><p>Döviz, TL değer kaybettiğinde koruma sağlar ama faiz getirmez ve kurun durağan olduğu dönemlerde reel olarak eriyebilir. Tek başına değil, çeşitlendirilmiş bir dağılımın parçası olarak düşünülür.</p></details>
<details><summary>Cumhuriyet (ata) altını nedir?</summary><p>Cumhuriyet altını, üzerinde Atatürk kabartması bulunan basılı altın türüdür. Yatırım ve hediye amaçlı yaygındır; işçilik payı olduğu için gram altına göre alış-satış makası daha geniş olabilir.</p></details>
<details><summary>Fiziki altın mı, banka (kâğıt) altını mı?</summary><p>Fiziki altın elinde tutulur ama saklama ve güvenlik derdi vardır. Banka/kâğıt altın (altın hesabı) pratiktir ve kolay alınıp satılır; tercih, likidite ve güven ihtiyacına göre değişir.</p></details>

<h2 id="kripto">Kripto Para</h2>
<details><summary>Kripto para nedir?</summary><p>Kripto para, merkezi bir otoriteye bağlı olmadan blok zinciri teknolojisiyle çalışan dijital varlıktır (Bitcoin, Ethereum gibi). Yüksek getiri potansiyeli kadar yüksek risk taşır.</p></details>
<details><summary>Kripto para riskli mi?</summary><p>Evet, kripto çok yüksek volatiliteye sahiptir; kısa sürede büyük değer kayıpları yaşanabilir. Genelde portföyün yalnızca kaybını göze alabileceğin küçük bir kısmıyla değerlendirilmesi önerilir.</p></details>
<details><summary>Bitcoin nedir?</summary><p>Bitcoin, 2009&rsquo;da ortaya çıkan ilk ve en bilinen kripto paradır. Arzı sınırlıdır ve merkezi olmayan bir ağda çalışır; çok oynak bir varlık olarak kabul edilir.</p></details>
<details><summary>Stablecoin nedir?</summary><p>Stablecoin, değeri genelde dolar gibi bir varlığa sabitlenmiş kripto paradır (örneğin USDT). Amacı, kripto dünyasında oynaklığı düşük bir &ldquo;sabit&rdquo; değer sunmaktır; yine de tamamen risksiz değildir.</p></details>
<details><summary>Kripto cüzdanı nedir, kripto nasıl güvende tutulur?</summary><p>Kripto cüzdanı, kripto varlıklarına erişimi sağlayan (özel anahtarını tutan) yazılım ya da cihazdır. Anahtarını kimseyle paylaşmamak, güçlü şifre ve iki adımlı doğrulama kullanmak güvenliğin temelidir.</p></details>

<h2 id="portfoy">Portföy &amp; Strateji</h2>
<details><summary>Portföy çeşitlendirme nedir?</summary><p>Parayı farklı davranan birden fazla varlığa dağıtarak riski azaltmaktır. Biri düşerken diğeri dengeler; tek bir kötü haberde her şeyini kaybetmezsin.</p></details>
<details><summary>Uzun vade mi kısa vade mi daha iyi?</summary><p>Uzun vade, dalgalanmaların etkisini azaltır ve bileşik getiriden faydalanmayı sağlar. Kısa vadede piyasa tahmini zordur ve risk artar; vaden hedefine göre belirlenir.</p></details>
<details><summary>Enflasyona karşı ne yapmalıyım?</summary><p>Nakiti eritmemek için enflasyonu yenme potansiyeli olan araçlara çeşitlendirilmiş şekilde yönelmek ve her varlığın reel getirisini izlemek genel bir yaklaşımdır. Amaç, sadece nominal değil reel olarak kazanmaktır.</p></details>
<details><summary>Fon nedir?</summary><p>Fon, birçok yatırımcının parasının bir havuzda toplanıp profesyonelce farklı varlıklara yatırıldığı bir üründür. Küçük tutarla çeşitlendirme imkânı sağlar.</p></details>
<details><summary>Dolar maliyet ortalaması (DCA) nedir?</summary><p>DCA, belirli aralıklarla (örneğin her ay) sabit tutarda yatırım yapmaktır. Fiyat yüksekken az, düşükken çok alırsın; böylece ortalaman dengelenir ve zamanlama stresi azalır.</p></details>
<details><summary>Portföyü yeniden dengeleme (rebalancing) nedir?</summary><p>Zamanla bazı varlıklar büyür ve dağılımın hedeften sapar. Rebalancing, portföyü belirli aralıklarla hedef oranlara geri getirmektir; riski kontrol altında tutmaya yarar.</p></details>
<details><summary>Kaldıraç nedir, riski nedir?</summary><p>Kaldıraç, borçla daha büyük pozisyon almaktır; kazancı da zararı da büyütür. Yeni başlayanlar için çok risklidir ve tüm sermayeni hızla kaybettirebilir.</p></details>
<details><summary>Stop-loss nedir?</summary><p>Stop-loss, bir varlık belirlediğin fiyata düşünce otomatik satış emridir. Zararı sınırlamak için kullanılır; ani düşüşlerde kontrolsüz kayıpları önlemeye yardımcı olur.</p></details>

<h2 id="ekonomi">Ekonomi &amp; Piyasa</h2>
<details><summary>Döviz kuru neden yükselir veya düşer?</summary><p>Kur; arz-talep, faiz, enflasyon, dış ticaret ve beklentiler gibi birçok faktörle değişir. TL&rsquo;ye talep azalır ya da dövize talep artarsa kur yükselir.</p></details>
<details><summary>Altın fiyatını ne belirler?</summary><p>Altın fiyatı; küresel ons altın fiyatı, dolar/TL kuru, faizler, jeopolitik riskler ve talep ile belirlenir. Türkiye&rsquo;de gram altın hem ons hem kurdan etkilenir.</p></details>
<details><summary>Faiz artışı borsayı nasıl etkiler?</summary><p>Faiz artışı genelde borsaya olumsuz etki eder: mevduat ve tahvil cazipleşir, şirketlerin borçlanma maliyeti artar. Ama etki sektöre ve beklentilere göre değişebilir.</p></details>

<h2 id="vergi">Vergi &amp; Yasal</h2>
<details><summary>Borsa kazancında vergi var mı?</summary><p>Hisse ve yatırım araçlarının vergilendirilmesi araca, elde tutma süresine ve güncel mevzuata göre değişir. Kesin ve güncel durum için resmi kaynaklara veya bir mali müşavire başvurmak gerekir.</p></details>
<details><summary>Kripto kazancı vergilendirilir mi?</summary><p>Kripto varlıkların vergilendirilmesi Türkiye&rsquo;de gelişen ve değişebilen bir konudur. Güncel yükümlülükler için resmi düzenlemeleri ve bir uzmanı takip etmek en doğrusudur.</p></details>
<details><summary>Yatırım tavsiyesi almak yasal mı?</summary><p>Kişiye özel yatırım danışmanlığı Türkiye&rsquo;de SPK lisansı gerektiren bir faaliyettir. Lisanssız kişi veya kaynaklardan gelen &ldquo;şunu al, şunu sat&rdquo; tarzı öneriler risklidir; bilgi ile tavsiyeyi ayırmak önemlidir.</p></details>
`.trim(),
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
