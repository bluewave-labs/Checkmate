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

<p align="center"><strong>Open source приложение для мониторинга доступности и инфраструктуры</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


В этом репозитории находятся как frontend, так и backend Checkmate — open-source-инструмента самостоятельного хостинга для отслеживания оборудования серверов, времени работы, времени отклика и инцидентов в реальном времени с наглядными визуализациями. Checkmate регулярно проверяет, доступен ли сервер/сайт и работает ли он оптимально, предоставляя оповещения и отчёты о доступности, простое и времени отклика отслеживаемых сервисов в реальном времени.

У Checkmate также есть агент под названием [Capture](https://github.com/bluewave-labs/capture) для получения данных с удалённых серверов. Capture не является обязательным для работы Checkmate, но даёт дополнительную информацию о состоянии CPU, RAM, диска и температуры ваших серверов. Capture работает на Linux, Windows, Mac, Raspberry Pi и любом устройстве, способном запускать Go.

Checkmate прошёл нагрузочное тестирование с 1000+ активных мониторов без каких-либо заметных проблем или просадок производительности.

## 📚 Содержание

- [📦 Демо](#demo)
- [🔗 Руководство пользователя](#users-guide)
- [🛠️ Установка](#installation)
- [🚀 Производительность](#performance)
- [💚 Вопросы и идеи](#questions--ideas)
- [🧩 Возможности](#features)
- [🏗️ Скриншоты](#screenshots)
- [🏗️ Технологии](#tech-stack)
- [🔗 Несколько ссылок](#a-few-links)
- [🤝 Участие](#contributing)


<a id="demo"></a>
## Демо

Последнюю сборку [Checkmate](https://demo.checkmate.so/) можно увидеть в действии.

Имя пользователя — demouser@demo.com, пароль — Demouser1! (Обратите внимание: мы периодически обновляем демо-сервер; если что-то не работает, напишите нам на канале Discussions).

<a id="users-guide"></a>
## Руководство пользователя

Инструкции по использованию доступны [здесь](https://checkmate.so/docs).

## Требования
- Установленный [Docker](https://www.docker.com/)
- Установленный [Git](https://git-scm.com/)

<a id="installation"></a>
## Установка

Инструкции по установке смотрите на [портале документации Checkmate](https://checkmate.so/docs).

В качестве альтернативы вы можете использовать [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](../../charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (ЮАР), [Cloudzy](https://cloudzy.com/marketplace/checkmate) или [Pikapods](https://www.pikapods.com/), чтобы быстро поднять инстанс Checkmate. Если вы хотите мониторить серверную инфраструктуру, потребуется агент [Capture](https://github.com/bluewave-labs/capture). В репозитории Capture также есть инструкции по установке.

### Использование собственного УЦ

Если нужно мониторить внутренние HTTPS-эндпоинты с сертификатами от приватных УЦ (например, Smallstep), смотрите наше [руководство по доверию собственным УЦ](../custom-ca-trust.md) с параметрами конфигурации Docker.

Дополнительная документация — в [каталоге docs](../).

<a id="performance"></a>
## Производительность

Благодаря многочисленным оптимизациям Checkmate работает с исключительно низким потреблением памяти и требует минимума RAM и CPU. Ниже — потребление памяти инстансом Node.js на сервере, который мониторит 323 сервера каждую минуту:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

А вот объём памяти MongoDB и Redis на том же сервере (398 МБ и 15 МБ) для того же количества серверов:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Вопросы и идеи

Если у вас есть вопросы, предложения или комментарии — есть несколько вариантов:

- [Канал в Discord](https://discord.gg/NAb6H3UTjK) (предпочтительно)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (заглядываем туда время от времени)

Смело задавайте вопросы и делитесь идеями — мы будем рады услышать вас!

<a id="features"></a>
## Возможности

- Полностью open source, можно развернуть на собственных серверах или домашних устройствах (например, Raspberry Pi 4 или 5)
- Несколько вариантов мониторинга: доступность, Docker, ping, SSL, порт, игровой сервер
- Мониторинг скорости загрузки страниц
- Мониторинг инфраструктуры (память, использование диска, производительность CPU, сеть и т. д.) — требуется агент [Capture](https://github.com/bluewave-labs/capture)
  - Выборочный мониторинг дисков с выбором точек монтирования
- Инциденты в одном месте
- Страницы статуса с 4 красивыми темами
- Уведомления по e-mail, через вебхуки, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Запланированное обслуживание
- Мониторинг JSON-запросов
- Многоязычная поддержка: арабский, китайский (упрощённый), китайский (традиционный, Тайвань), чешский, английский, финский, французский, немецкий, японский, португальский (Бразилия), русский, испанский, тайский, турецкий, украинский и вьетнамский


## Жизненный цикл монитора

1. Монитор выполняет проверку (HTTP / ping / порт / оборудование через агента Capture)
2. Результат сохраняется (успех/неудача + время отклика)
3. Недавние результаты проверяются по заданному порогу смены статуса
4. Если порог достигнут, а текущий статус отличается от предыдущего — состояние монитора изменяется (например, `initializing`, `up`, `down`, `breached`)
5. При смене состояния инцидент создаётся или закрывается в зависимости от текущего статуса
6. Уведомления отправляются в соответствии с настройками

<a id="screenshots"></a>
## Скриншоты

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
## Технологии

- [ReactJs](https://react.dev/)
- [MUI (React-фреймворк)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- И множество других open-source компонентов!

<a id="a-few-links"></a>
## Несколько ссылок

- Если хотите поддержать нас — поставьте ⭐ и нажмите «watch».
- Есть вопрос или предложение по дорожной карте/функциям? Загляните в наш [канал Discord](https://discord.gg/NAb6H3UTjK) или форум [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Нужно уведомление о новых релизах? Используйте [Newreleases](https://newreleases.io/) — бесплатный сервис отслеживания релизов.
- Посмотрите [видео по установке и использованию Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Участие

Мы — [Alex](http://github.com/ajhollid) (тимлид), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) и [Karen](https://github.com/karenvicent) — помогаем частным лицам и компаниям мониторить их инфраструктуру и серверы.

Мы гордимся тем, что выстраиваем крепкие связи с контрибьюторами на всех уровнях. Несмотря на то что проект молодой, Checkmate уже получил более 7000 звёзд и более 90 контрибьюторов со всего мира.

Наш репозиторий помечен сотрудниками **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes и NEC** — так что не стесняйтесь, присоединяйтесь, вносите вклад и учитесь вместе с нами!

Как внести вклад:

0. Поставьте звезду этому репозиторию :)
1. Прочтите [руководство контрибьютора](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Новичкам советуем посмотреть метку `good-first-issue`.
2. Если хотите глубже погрузиться в архитектуру — прочтите подробное описание [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate).
3. Откройте issue, если столкнулись с багом.
4. Если вы новичок — ищите `good-first-issue`.
5. Откройте pull request для добавления функций, улучшений или исправлений.
6. Посмотрите интерактивный обзор кодовой базы `Checkmate` в CodeCanvas [здесь](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Чтобы доработать имеющиеся симуляции потоков данных или создать новые, следуйте краткому туториалу [здесь](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
