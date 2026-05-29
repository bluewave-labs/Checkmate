<div dir="rtl">

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

<p align="center"><strong>تطبيق مفتوح المصدر لمراقبة الجاهزية والبنية التحتية</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


يحتوي هذا المستودع على واجهة المستخدم والخادم الخلفي معًا لـ Checkmate، وهي أداة مراقبة مفتوحة المصدر وقابلة للاستضافة الذاتية، تتيح تتبع عتاد الخوادم، وحالة التشغيل، وأزمنة الاستجابة، والحوادث في الوقت الحقيقي بتصورات أنيقة. يقوم Checkmate بفحص الخادم/الموقع بشكل دوري للتأكد من إمكانية الوصول إليه وعمله على النحو الأمثل، ويوفر تنبيهات وتقارير فورية حول توافر الخدمات المراقبة، وفترات التوقف، وأزمنة الاستجابة.

يمتلك Checkmate أيضًا وكيلًا يُسمى [Capture](https://github.com/bluewave-labs/capture) لجلب البيانات من الخوادم البعيدة. ليس Capture مطلوبًا لتشغيل Checkmate، لكنه يوفر معلومات إضافية حول حالة المعالج، والذاكرة، والقرص، ودرجة الحرارة لخوادمك. يعمل Capture على Linux وWindows وMac وRaspberry Pi، أو أي جهاز قادر على تشغيل Go.

تم اختبار Checkmate تحت الضغط مع أكثر من 1000 مراقبة نشطة دون أي مشاكل أو اختناقات أداء ملحوظة.

## 📚 المحتويات

- [📦 العرض التجريبي](#demo)
- [🔗 دليل المستخدم](#users-guide)
- [🛠️ التثبيت](#installation)
- [🚀 الأداء](#performance)
- [💚 الأسئلة والأفكار](#questions--ideas)
- [🧩 المزايا](#features)
- [🏗️ لقطات الشاشة](#screenshots)
- [🏗️ التقنيات المستخدمة](#tech-stack)
- [🔗 بعض الروابط](#a-few-links)
- [🤝 المساهمة](#contributing)


<a id="demo"></a>
## العرض التجريبي

يمكنك مشاهدة آخر إصدار من [Checkmate](https://demo.checkmate.so/) أثناء التشغيل.

اسم المستخدم هو demouser@demo.com وكلمة المرور Demouser1! (ملاحظة: نقوم بتحديث خادم العرض التجريبي من حين لآخر، فإذا لم يعمل، يُرجى إخبارنا في قناة Discussions).

<a id="users-guide"></a>
## دليل المستخدم

يمكنك العثور على تعليمات الاستخدام [هنا](https://checkmate.so/docs).

## المتطلبات المسبقة
- تثبيت [Docker](https://www.docker.com/)
- تثبيت [Git](https://git-scm.com/)

<a id="installation"></a>
## التثبيت

اطّلع على تعليمات التثبيت في [بوابة وثائق Checkmate](https://checkmate.so/docs).

بدلاً من ذلك، يمكنك استخدام [Coolify](https://coolify.io/)، أو [Elestio](https://elest.io/open-source/checkmate)، أو [K8s](./charts/helm/checkmate/INSTALLATION.md)، أو [Sive Host](https://sive.host) (جنوب أفريقيا)، أو [Cloudzy](https://cloudzy.com/marketplace/checkmate)، أو [Pikapods](https://www.pikapods.com/) لتشغيل نسخة من Checkmate بسرعة. إن أردت مراقبة البنية التحتية لخوادمك، ستحتاج إلى [وكيل Capture](https://github.com/bluewave-labs/capture). يحتوي مستودع Capture أيضًا على تعليمات التثبيت.

### استخدام شهادة CA مخصصة

إذا كنت بحاجة لمراقبة نقاط نهاية HTTPS داخلية بشهادات صادرة عن سلطات شهادات خاصة (مثل Smallstep)، راجع [دليل الثقة بشهادات CA المخصصة](../custom-ca-trust.md) لخيارات إعداد Docker.

للمزيد من الوثائق، راجع [مجلد docs](../).

<a id="performance"></a>
## الأداء

بفضل التحسينات الواسعة، يعمل Checkmate ببصمة ذاكرة صغيرة استثنائيًا، ولا يتطلب سوى الحد الأدنى من الذاكرة وموارد المعالج. فيما يلي استخدام الذاكرة لنسخة Node.js على خادم يراقب 323 خادمًا كل دقيقة:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

ويمكنك أيضًا رؤية بصمة الذاكرة لـ MongoDB وRedis على الخادم نفسه (398 ميجابايت و15 ميجابايت) لنفس عدد الخوادم:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## الأسئلة والأفكار

إذا كانت لديك أسئلة أو اقتراحات أو تعليقات، فلديك عدة خيارات:

- [قناة Discord](https://discord.gg/NAb6H3UTjK) (مفضّلة)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (نمر عليها من حين لآخر)

لا تتردد في طرح الأسئلة أو مشاركة أفكارك — يسعدنا التواصل معك!

<a id="features"></a>
## المزايا

- مفتوح المصدر بالكامل، يمكن نشره على خوادمك أو على أجهزتك المنزلية (مثل Raspberry Pi 4 أو 5)
- خيارات مراقبة متعددة: الجاهزية، Docker، Ping، SSL، المنفذ، خادم الألعاب
- مراقبة سرعة الصفحة
- مراقبة البنية التحتية (الذاكرة، استخدام القرص، أداء المعالج، الشبكة، إلخ) — يتطلب وكيل [Capture](https://github.com/bluewave-labs/capture)
  - مراقبة انتقائية للأقراص مع اختيار نقاط التحميل
- متابعة الحوادث بنظرة واحدة
- صفحات حالة بأربعة قوالب أنيقة
- إشعارات عبر البريد الإلكتروني، Webhooks، Discord، Slack، PagerDuty، Matrix، Microsoft Teams، Telegram، Pushover، Twilio (SMS)
- صيانة مجدولة
- مراقبة باستخدام استعلام JSON
- دعم متعدد اللغات: العربية، الصينية (المبسطة)، الصينية (التقليدية، تايوان)، التشيكية، الإنجليزية، الفنلندية، الفرنسية، الألمانية، اليابانية، البرتغالية (البرازيلية)، الروسية، الإسبانية، التايلاندية، التركية، الأوكرانية، والفيتنامية


## دورة حياة المراقبة

1. تقوم المراقبة بإجراء فحص (HTTP / Ping / منفذ / فحص عتاد عبر وكيل Capture)
2. يتم تخزين النتيجة (نجاح/فشل + زمن الاستجابة)
3. تُقيَّم النتائج الأخيرة وفقًا لعتبة تغيّر الحالة المضبوطة للمراقبة
4. إذا تحققت العتبة وكانت الحالة الحالية تختلف عن السابقة، تتغير حالة المراقبة (مثل `initializing`, `up`, `down`, `breached`)
5. عند تغير الحالة، يتم إنشاء حادث أو حله بحسب الحالة الحالية للمراقبة
6. تُطلَق الإشعارات استنادًا إلى الإعدادات

<a id="screenshots"></a>
## لقطات الشاشة

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
## التقنيات المستخدمة

- [ReactJs](https://react.dev/)
- [MUI (إطار عمل React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- والكثير من المكونات مفتوحة المصدر الأخرى!

<a id="a-few-links"></a>
## بعض الروابط

- إذا أردت دعمنا، فضع ⭐ على المستودع وانقر على "watch".
- لديك سؤال أو اقتراح يخص خارطة الطريق/المزايا؟ تفضل بزيارة [قناة Discord](https://discord.gg/NAb6H3UTjK) أو منتدى [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- هل تحتاج إشعارًا عند صدور إصدار جديد؟ استخدم [Newreleases](https://newreleases.io/) — وهي خدمة مجانية لتتبع الإصدارات.
- شاهد [فيديو تثبيت Checkmate واستخدامه](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## المساهمة

نحن [Alex](http://github.com/ajhollid) (قائد الفريق)، و[Gorkem](http://github.com/gorkem-bwl/)، و[Aryaman](https://github.com/Br0wnHammer)، و[Mert](https://github.com/mertssmnoglu)، و[Karen](https://github.com/karenvicent) نساعد الأفراد والشركات على مراقبة بنيتهم التحتية وخوادمهم.

نفخر ببناء علاقات قوية مع المساهمين على جميع المستويات. وعلى الرغم من حداثة المشروع، فقد حصل Checkmate بالفعل على أكثر من 7000 نجمة، وجذب أكثر من 90 مساهمًا من جميع أنحاء العالم.

تم تنجيم مستودعنا من قِبل موظفين في **Google، Microsoft، Intel، Cisco، Tencent، Electronic Arts، ByteDance، JP Morgan Chase، Deloitte، Accenture، Foxconn، Broadcom، China Telecom، Barclays، Capgemini، Wipro، Cloudflare، Dassault Systèmes، وNEC** — فلا تتردد، انضم إلينا، وساهم، وتعلّم معنا!

كيف يمكنك المساهمة:

0. ضع نجمة على هذا المستودع :)
1. راجع [دليل المساهمين](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). يُشجَّع المبتدئون على تفقد وسم `good-first-issue`.
2. اقرأ بنية [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) المفصّلة إذا أردت التعمق في المعمارية.
3. افتح issue إذا كنت تعتقد أنك واجهت مشكلة.
4. إذا كنت قادمًا جديدًا، فابحث عن وسوم `good-first-issue`.
5. أنشئ pull request لإضافة ميزات جديدة، أو تحسينات في تجربة المستخدم، أو إصلاح الأخطاء.
6. تصفّح الجولة التفاعلية في قاعدة كود `Checkmate` على CodeCanvas [من هنا](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). لتحسين محاكاة تدفق البيانات الحالية أو إنشاء جديدة، اتبع البرنامج التعليمي السريع [هنا](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)

</div>
