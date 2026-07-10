<p align=center> <a href="https://trendshift.io/repositories/12443" target="_blank"><img src="https://trendshift.io/api/badge/repositories/12443" alt="bluewave-labs%2Fcheckmate | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a></p>

<p align="center">
  🇺🇸 <a href="../../README.md">English</a> |
  🇸🇦 <a href="README.ar.md">العربية</a> |
  🇪🇸 <a href="README.ca.md">Català</a> |
  🇨🇿 <a href="README.cs.md">Čeština</a> |
  🇩🇪 <a href="README.de.md">Deutsch</a> |
  🇪🇸 <a href="README.es.md">Español</a> |
  🇫🇮 <a href="README.fi.md">Suomi</a> |
  🇫🇷 <a href="README.fr.md">Français</a> |
  🇮🇹 <a href="README.it.md">Italiano</a> |
  🇯🇵 <a href="README.ja.md">日本語</a> |
  🇧🇷 <a href="README.pt-BR.md">Português (Brasil)</a> |
  🇷🇺 <a href="README.ru.md">Русский</a> |
  🇹🇭 <a href="README.th.md">ไทย</a> |
  🇹🇷 <a href="README.tr.md">Türkçe</a> |
  🇺🇦 <a href="README.uk.md">Українська</a> |
  🇻🇳 <a href="README.vi.md">Tiếng Việt</a> |
  🇨🇳 <a href="README.zh-CN.md">简体中文</a> |
  🇹🇼 <a href="README.zh-TW.md">繁體中文</a>
</p>

![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Açık kaynaklı çalışma süresi ve altyapı izleme uygulaması</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Bu depo, sunucu donanımını, çalışma süresini, yanıt sürelerini ve olayları zarif görselleştirmelerle gerçek zamanlı takip eden, açık kaynaklı ve kendi sunucunuzda barındırılan bir izleme aracı olan Checkmate'in hem frontend hem de backend tarafını içerir. Checkmate, bir sunucunun ya da web sitesinin erişilebilir ve düzgün çalışıyor olup olmadığını düzenli olarak kontrol eder; izlenen servislerin kullanılabilirliği, kesintileri ve yanıt süreleri hakkında gerçek zamanlı uyarılar ve raporlar sağlar.

Checkmate'in ayrıca uzak sunuculardan veri çekmek için [Capture](https://github.com/bluewave-labs/capture) adında bir ajanı vardır. Capture, Checkmate'i çalıştırmak için zorunlu değildir; ancak sunucularınızın CPU, RAM, disk ve sıcaklık durumu hakkında ek bilgi sağlar. Capture; Linux, Windows, Mac, Raspberry Pi ve Go çalıştırabilen herhangi bir cihazda kullanılabilir.

Checkmate, 1000'den fazla aktif monitör ile herhangi bir sorun ya da performans darboğazı yaşamadan stres testinden geçirilmiştir.

## 📚 İçindekiler

- [📦 Demo](#demo)
- [🔗 Kullanıcı kılavuzu](#users-guide)
- [🛠️ Kurulum](#installation)
- [🚀 Performans](#performance)
- [💚 Sorular & fikirler](#questions--ideas)
- [🧩 Özellikler](#features)
- [🏗️ Ekran görüntüleri](#screenshots)
- [🏗️ Teknoloji yığını](#tech-stack)
- [🔗 Birkaç bağlantı](#a-few-links)
- [🤝 Katkıda bulunma](#contributing)


<a id="demo"></a>
## Demo

[Checkmate](https://demo.checkmate.so/)'in en son sürümünü iş başında görebilirsiniz.

Kullanıcı adı demouser@demo.com, şifre Demouser1!'dir (Not: Demo sunucusunu zaman zaman güncelliyoruz; çalışmazsa Discussions kanalından bize haber verin).

<a id="users-guide"></a>
## Kullanıcı kılavuzu

Kullanım talimatlarını [burada](https://checkmate.so/docs) bulabilirsiniz.

## Ön koşullar
- [Docker](https://www.docker.com/) kurulu
- [Git](https://git-scm.com/) kurulu

<a id="installation"></a>
## Kurulum

Kurulum talimatları için [Checkmate dokümantasyon portalına](https://checkmate.so/docs) bakın.

Alternatif olarak hızlıca bir Checkmate örneği çalıştırmak için [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Güney Afrika), [Cloudzy](https://cloudzy.com/marketplace/checkmate) veya [Pikapods](https://www.pikapods.com/)'u kullanabilirsiniz. Sunucu altyapınızı izlemek isterseniz [Capture ajanına](https://github.com/bluewave-labs/capture) ihtiyacınız olacak. Capture deposu da kurulum talimatlarını içerir.

### Özel CA Kullanımı

Özel sertifika otoritelerinden (örneğin Smallstep) gelen sertifikalarla iç HTTPS uç noktalarını izlemeniz gerekiyorsa, Docker yapılandırma seçenekleri için [Özel CA Güven Kılavuzumuza](../custom-ca-trust.md) bakın.

Daha fazla dokümantasyon için [docs dizinine](../) göz atın.

<a id="performance"></a>
## Performans

Geniş kapsamlı optimizasyonlar sayesinde Checkmate son derece düşük bellek ayak iziyle çalışır ve minimum bellek ile CPU kaynağı gerektirir. Aşağıda her dakika 323 sunucuyu izleyen bir sunucudaki Node.js örneğinin bellek kullanımı yer almaktadır:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Aynı sayıda sunucu için aynı sunucudaki MongoDB ve Redis bellek ayak izini de görebilirsiniz (398 MB ve 15 MB):

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Sorular & fikirler

Sorularınız, önerileriniz ya da yorumlarınız varsa birkaç seçeneğiniz var:

- [Discord kanalı](https://discord.gg/NAb6H3UTjK) (tercih edilen)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (zaman zaman buraya bakıyoruz)

Soru sormaktan ya da fikirlerinizi paylaşmaktan çekinmeyin — sizi dinlemekten mutluluk duyarız!

<a id="features"></a>
## Özellikler

- Tamamen açık kaynak; kendi sunucularınızda ya da ev cihazlarınızda (örn. Raspberry Pi 4 veya 5) çalıştırılabilir
- Birden fazla izleme seçeneği: çalışma süresi, Docker, ping, SSL, port, oyun sunucusu
- Sayfa hızı izleme
- Altyapı izleme (bellek, disk kullanımı, CPU performansı, ağ vb.) — [Capture](https://github.com/bluewave-labs/capture) ajanı gerekir
  - Bağlama noktası seçimiyle seçici disk izleme
- Olayları tek bakışta görme
- 4 farklı şık temaya sahip durum sayfaları
- E-posta, webhook, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS) bildirimleri
- Planlı bakım
- JSON sorgu izleme
- Çoklu dil desteği: Arapça, Çince (Basitleştirilmiş), Çince (Geleneksel, Tayvan), Çekçe, İngilizce, Fince, Fransızca, Almanca, Japonca, Portekizce (Brezilya), Rusça, İspanyolca, Tayca, Türkçe, Ukraynaca ve Vietnamca


## Monitör yaşam döngüsü

1. Bir monitör kontrol gerçekleştirir (HTTP / ping / port / Capture ajanı üzerinden donanım)
2. Sonuç kaydedilir (başarılı/başarısız + yanıt süresi)
3. Son sonuçlar, monitörün durum değişikliği eşiğine göre değerlendirilir
4. Eşik aşıldığında ve mevcut durum öncekinden farklıysa, monitörün durumu değişir (örn. `initializing`, `up`, `down`, `breached`)
5. Durum değişikliğinde, monitörün geçerli durumuna bağlı olarak bir olay oluşturulur ya da çözülür
6. Yapılandırmaya göre bildirimler tetiklenir

<a id="screenshots"></a>
## Ekran görüntüleri

<p>
<img width="1628" alt="image" src="https://github.com/user-attachments/assets/2eff6464-0738-4a32-9312-26e1e8e86275" />
</p>
<p>
  <img width="1656" alt="image" src="https://github.com/user-attachments/assets/616c3563-c2a7-4ee4-af6c-7e6068955d1a" />
</p>
<p>
</p><img width="1652" alt="image" src="https://github.com/user-attachments/assets/7912d7cf-0d0e-4f26-aa5c-2ad7170b5c99" />
</p>
<p>
<img width="1652" alt="image" src="https://github.com/user-attachments/assets/08c2c6ac-3a2f-44d1-a229-d1746a3f9d16" />
</p>



<a id="tech-stack"></a>
## Teknoloji yığını

- [ReactJs](https://react.dev/)
- [MUI (React framework)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Ve birçok başka açık kaynak bileşen!

<a id="a-few-links"></a>
## Birkaç bağlantı

- Bizi desteklemek isterseniz, lütfen ⭐ verip "watch" düğmesine basmayı düşünün.
- Yol haritası veya özellik seti için bir sorunuz ya da öneriniz var mı? [Discord kanalımıza](https://discord.gg/NAb6H3UTjK) veya [Discussions](https://github.com/bluewave-labs/checkmate/discussions) forumumuza bakın.
- Yeni bir sürüm çıktığında haber almak ister misiniz? Ücretsiz bir sürüm takip servisi olan [Newreleases](https://newreleases.io/)'ü kullanın.
- Bir Checkmate [kurulum ve kullanım videosu](https://www.youtube.com/watch?v=GfFOc0xHIwY) izleyin.

<a id="contributing"></a>
## Katkıda bulunma

Biz; [Alex](http://github.com/ajhollid) (takım lideri), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) ve [Karen](https://github.com/karenvicent) olarak bireylerin ve işletmelerin altyapı ile sunucularını izlemelerine yardımcı oluyoruz.

Her seviyedeki katkıda bulunanlarla güçlü bağlar kurmaktan gurur duyuyoruz. Genç bir proje olmasına rağmen Checkmate şimdiden 7000'den fazla yıldız ve dünya genelinde 90'dan fazla katkıda bulunan kazanmıştır.

Reponuz **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes ve NEC** çalışanları tarafından yıldızlanmıştır — siz de çekinmeyin, katılın, katkıda bulunun ve bizimle birlikte öğrenin!

Nasıl katkıda bulunabilirsiniz:

0. Bu repoya yıldız verin :)
1. [Katkıda bulunma kılavuzunu](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md) inceleyin. Yeni başlayanların `good-first-issue` etiketine bakmasını öneririz.
2. Mimari hakkında derinlemesine bilgi almak isterseniz, ayrıntılı [Checkmate yapısını](https://deepwiki.com/bluewave-labs/Checkmate) okuyun.
3. Bir hata yakaladığınızı düşünüyorsanız bir issue açın.
4. Yeni başlıyorsanız `good-first-issue`'lara bakın.
5. Yeni özellikler eklemek, yaşam kalitesi iyileştirmeleri yapmak veya hata düzeltmek için pull request açın.
6. CodeCanvas'taki `Checkmate` kod tabanının interaktif gezintisine [buradan](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true) göz atın. Mevcut veri akışı simülasyonlarını iyileştirmek veya yenilerini oluşturmak için [buradaki](https://docs.code-canvas.com/updating-diagram) hızlı eğitimi takip edin.

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
