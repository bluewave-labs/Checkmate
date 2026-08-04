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

> ⚠️ Цей переклад є машинним чернетковим варіантом. Будемо вдячні за виправлення від носіїв мови через pull request.


![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Open source застосунок для моніторингу доступності та інфраструктури</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Цей репозиторій містить як фронтенд, так і бекенд Checkmate — інструменту моніторингу з відкритим кодом і самостійним розгортанням для відстеження апаратного забезпечення серверів, часу безперебійної роботи, часу відгуку та інцидентів у реальному часі з красивими візуалізаціями. Checkmate регулярно перевіряє, чи доступний сервер або сайт і чи працює він оптимально, надаючи сповіщення та звіти у реальному часі про доступність, простої та час відгуку моніторованих сервісів.

У Checkmate також є агент під назвою [Capture](https://github.com/bluewave-labs/capture) для отримання даних з віддалених серверів. Capture не є обов'язковим для роботи Checkmate, але дає додаткову інформацію про стан CPU, RAM, диска та температури ваших серверів. Capture можна запускати на Linux, Windows, Mac, Raspberry Pi або будь-якому пристрої, здатному виконувати Go.

Checkmate пройшов навантажувальне тестування з понад 1000 активних моніторів без жодних помітних проблем чи вузьких місць.

## 📚 Зміст

- [📦 Демо](#demo)
- [🔗 Посібник користувача](#users-guide)
- [🛠️ Встановлення](#installation)
- [🚀 Продуктивність](#performance)
- [💚 Запитання та ідеї](#questions--ideas)
- [🧩 Можливості](#features)
- [🏗️ Знімки екрана](#screenshots)
- [🏗️ Технології](#tech-stack)
- [🔗 Кілька посилань](#a-few-links)
- [🤝 Внески](#contributing)


<a id="demo"></a>
## Демо

Найновішу збірку [Checkmate](https://demo.checkmate.so/) можна побачити в дії.

Логін — demouser@demo.com, пароль — Demouser1! (Зверніть увагу: ми час від часу оновлюємо демо-сервер; якщо щось не працює — напишіть нам у Discussions).

<a id="users-guide"></a>
## Посібник користувача

Інструкції з використання доступні [тут](https://checkmate.so/docs).

## Передумови
- Встановлений [Docker](https://www.docker.com/)
- Встановлений [Git](https://git-scm.com/)

<a id="installation"></a>
## Встановлення

Інструкції зі встановлення дивіться у [порталі документації Checkmate](https://checkmate.so/docs).

Альтернативно, для швидкого розгортання Checkmate можна скористатися [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](../../charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Південна Африка), [Cloudzy](https://cloudzy.com/marketplace/checkmate) або [Pikapods](https://www.pikapods.com/). Якщо хочете моніторити серверну інфраструктуру, знадобиться агент [Capture](https://github.com/bluewave-labs/capture). У репозиторії Capture також є інструкції зі встановлення.

### Використання власного УЦ

Якщо потрібно моніторити внутрішні HTTPS-ендпоїнти з сертифікатами від приватних центрів сертифікації (як-от Smallstep), див. наш [посібник з довіри власному УЦ](../custom-ca-trust.md) для опцій конфігурації Docker.

Додаткову документацію шукайте у [каталозі docs](../).

<a id="performance"></a>
## Продуктивність

Завдяки численним оптимізаціям Checkmate працює з винятково низьким споживанням пам'яті, потребуючи мінімум RAM і CPU. Ось використання пам'яті Node.js-інстансу на сервері, який моніторить 323 сервери щохвилини:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

А ось обсяг пам'яті MongoDB і Redis на тому ж сервері (398 МБ і 15 МБ) для тієї ж кількості серверів:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Запитання та ідеї

Якщо у вас є запитання, пропозиції чи коментарі, є кілька варіантів:

- [Канал у Discord](https://discord.gg/NAb6H3UTjK) (бажано)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (заходимо туди час від часу)

Не соромтеся ставити запитання чи ділитися ідеями — ми будемо раді почути вас!

<a id="features"></a>
## Можливості

- Повністю відкритий код, розгортається на ваших серверах чи домашніх пристроях (наприклад, Raspberry Pi 4 або 5)
- Кілька варіантів моніторингу: доступність, Docker, ping, SSL, порт, ігровий сервер
- Моніторинг швидкості сторінок
- Моніторинг інфраструктури (пам'ять, використання диска, продуктивність CPU, мережа тощо) — потрібен агент [Capture](https://github.com/bluewave-labs/capture)
  - Вибірковий моніторинг дисків із вибором точок монтування
- Інциденти з одного погляду
- Сторінки статусу з 4 красивими темами
- Сповіщення електронною поштою, через вебхуки, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Заплановане обслуговування
- Моніторинг за допомогою JSON-запитів
- Багатомовна підтримка: арабська, китайська (спрощена), китайська (традиційна, Тайвань), чеська, англійська, фінська, французька, німецька, японська, португальська (Бразилія), російська, іспанська, тайська, турецька, українська та в'єтнамська


## Життєвий цикл монітора

1. Монітор виконує перевірку (HTTP / ping / порт / апаратне забезпечення через агента Capture)
2. Результат зберігається (успіх/невдача + час відгуку)
3. Останні результати оцінюються відносно налаштованого порога зміни статусу
4. Якщо порогу досягнуто, а поточний статус відрізняється від попереднього — стан монітора змінюється (наприклад, `initializing`, `up`, `down`, `breached`)
5. При зміні стану інцидент або створюється, або закривається, залежно від поточного статусу
6. Сповіщення спрацьовують згідно з налаштуваннями

<a id="screenshots"></a>
## Знімки екрана

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
## Технології

- [ReactJs](https://react.dev/)
- [MUI (React-фреймворк)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- І безліч інших компонентів з відкритим кодом!

<a id="a-few-links"></a>
## Кілька посилань

- Якщо хочете підтримати нас, поставте ⭐ і натисніть «watch».
- Маєте запитання чи пропозицію щодо дорожньої карти/функцій? Загляньте в наш [Discord-канал](https://discord.gg/NAb6H3UTjK) або форум [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Потрібне сповіщення про нові релізи? Скористайтеся [Newreleases](https://newreleases.io/) — безкоштовним сервісом відстеження релізів.
- Подивіться [відео зі встановлення та використання Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Внески

Ми — [Alex](http://github.com/ajhollid) (тімлід), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) і [Karen](https://github.com/karenvicent) — допомагаємо приватним особам і компаніям моніторити їх інфраструктуру та сервери.

Ми пишаємося тим, що будуємо міцні зв'язки з контриб'юторами на всіх рівнях. Попри молодий вік, Checkmate уже зібрав понад 7000 зірок і понад 90 контриб'юторів з усього світу.

Наш репозиторій позначений співробітниками **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes і NEC** — тож не соромтеся, приєднуйтесь, робіть внесок і вчіться разом з нами!

Як долучитися:

0. Поставте зірку цьому репозиторію :)
1. Прочитайте [посібник контриб'ютора](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Початківцям радимо подивитися мітку `good-first-issue`.
2. Прочитайте детальний опис [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate), якщо хочете глибше зануритись у архітектуру.
3. Відкрийте issue, якщо вважаєте, що знайшли баг.
4. Якщо ви новачок, шукайте `good-first-issue`.
5. Робіть pull request, щоб додати функції, покращити зручність використання або виправити баги.
6. Перегляньте інтерактивний огляд кодової бази `Checkmate` у CodeCanvas [тут](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Щоб уточнити наявні симуляції потоків даних або створити нові, перейдіть до короткого туторіалу [тут](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
