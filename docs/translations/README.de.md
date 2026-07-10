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

<p align="center"><strong>Eine Open-Source-Anwendung zur Überwachung von Verfügbarkeit und Infrastruktur</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Dieses Repository enthält Frontend und Backend von Checkmate — einem Open-Source-, selbst gehosteten Monitoring-Tool, das Server-Hardware, Verfügbarkeit, Antwortzeiten und Vorfälle in Echtzeit mit klaren Visualisierungen verfolgt. Checkmate prüft regelmäßig, ob ein Server oder eine Website erreichbar ist und sauber läuft, und liefert Echtzeit-Alerts und Reports zu Verfügbarkeit, Ausfallzeiten und Antwortzeiten der überwachten Dienste.

Checkmate hat außerdem einen Agenten namens [Capture](https://github.com/bluewave-labs/capture), der Daten von entfernten Servern abholt. Capture ist nicht zwingend erforderlich, liefert aber zusätzliche Informationen zu CPU, RAM, Festplatte und Temperatur deiner Server. Capture läuft auf Linux, Windows, macOS, Raspberry Pi oder jedem anderen Gerät, das Go ausführen kann.

Checkmate wurde mit über 1.000 aktiven Monitoren stresstestet — ohne erkennbare Probleme oder Performance-Engpässe.

## 📚 Inhaltsverzeichnis

- [📦 Demo](#demo)
- [🔗 Benutzerhandbuch](#users-guide)
- [🛠️ Installation](#installation)
- [🚀 Leistung](#performance)
- [💚 Fragen & Ideen](#questions--ideas)
- [🧩 Funktionen](#features)
- [🏗️ Screenshots](#screenshots)
- [🏗️ Tech-Stack](#tech-stack)
- [🔗 Einige Links](#a-few-links)
- [🤝 Mitwirken](#contributing)


<a id="demo"></a>
## Demo

Den aktuellen Build von [Checkmate](https://demo.checkmate.so/) kannst du live ausprobieren.

Der Benutzername ist demouser@demo.com, das Passwort Demouser1!. (Wir aktualisieren den Demo-Server ab und zu — sollte er gerade nicht erreichbar sein, sag uns Bescheid im Discussions-Kanal.)

<a id="users-guide"></a>
## Benutzerhandbuch

Die Nutzungsanleitung findest du [hier](https://checkmate.so/docs).

## Voraussetzungen
- [Docker](https://www.docker.com/) installiert
- [Git](https://git-scm.com/) installiert

<a id="installation"></a>
## Installation

Die Installationsanleitung findest du im [Dokumentationsportal von Checkmate](https://checkmate.so/docs).

Alternativ kannst du [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Südafrika), [Cloudzy](https://cloudzy.com/marketplace/checkmate) oder [Pikapods](https://www.pikapods.com/) nutzen, um schnell eine Checkmate-Instanz hochzuziehen. Für das Monitoring deiner Server-Infrastruktur brauchst du den [Capture-Agenten](https://github.com/bluewave-labs/capture); dessen Repository enthält ebenfalls eine Installationsanleitung.

### Eigene CA verwenden

Wenn du interne HTTPS-Endpunkte mit Zertifikaten privater Zertifizierungsstellen (z. B. Smallstep) überwachen möchtest, schau in unseren [Leitfaden für eigene CAs](../custom-ca-trust.md) — dort stehen die passenden Docker-Konfigurationen.

Weitere Dokumentation liegt im [docs-Verzeichnis](../).

<a id="performance"></a>
## Leistung

Dank umfangreicher Optimierungen läuft Checkmate mit einem außergewöhnlich geringen Speicherverbrauch und braucht nur sehr wenig RAM und CPU. Hier der Speicherverbrauch einer Node.js-Instanz auf einem Server, der jede Minute 323 Server prüft:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Hier der Speicherverbrauch von MongoDB und Redis auf demselben Server (398 MB bzw. 15 MB) für dieselbe Anzahl von Servern:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Fragen & Ideen

Falls du Fragen, Vorschläge oder Anmerkungen hast, gibt es mehrere Anlaufstellen:

- [Discord](https://discord.gg/NAb6H3UTjK) (bevorzugt)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (wir schauen regelmäßig vorbei)

Frag einfach drauflos oder teile deine Ideen — wir freuen uns auf dein Feedback!

<a id="features"></a>
## Funktionen

- Vollständig Open Source, auf eigenen Servern oder Heimgeräten (z. B. Raspberry Pi 4 oder 5) bereitstellbar
- Mehrere Monitoring-Optionen: Uptime, Docker, Ping, SSL, Port, Game-Server
- Page-Speed-Monitoring
- Infrastruktur-Monitoring (RAM, Festplattennutzung, CPU-Leistung, Netzwerk etc.) — benötigt den [Capture](https://github.com/bluewave-labs/capture)-Agenten
  - Selektives Festplatten-Monitoring mit Mountpoint-Auswahl
- Vorfälle auf einen Blick
- Statusseiten mit 4 schönen Themes
- Benachrichtigungen per E-Mail, Webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Geplante Wartungen
- JSON-Abfrage-Monitoring
- Mehrsprachige Unterstützung für Arabisch, Chinesisch (Vereinfacht), Chinesisch (Traditionell, Taiwan), Tschechisch, Englisch, Finnisch, Französisch, Deutsch, Japanisch, Portugiesisch (Brasilien), Russisch, Spanisch, Thailändisch, Türkisch, Ukrainisch und Vietnamesisch


## Monitor-Lebenszyklus

1. Ein Monitor führt eine Prüfung durch (HTTP / Ping / Port / Hardware über den Capture-Agenten)
2. Das Ergebnis wird gespeichert (Erfolg/Fehler + Antwortzeit)
3. Die jüngsten Prüfergebnisse werden gegen den konfigurierten Schwellenwert für Statusänderungen des Monitors ausgewertet
4. Wenn der Schwellenwert erreicht ist und der aktuelle Status vom vorherigen abweicht, ändert sich der Zustand des Monitors (z. B. `initializing`, `up`, `down`, `breached`)
5. Bei einem Zustandswechsel wird je nach aktuellem Status entweder ein Vorfall erstellt oder geschlossen
6. Benachrichtigungen werden je nach Konfiguration ausgelöst

<a id="screenshots"></a>
## Screenshots

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
## Tech-Stack

- [ReactJs](https://react.dev/)
- [MUI (React-Framework)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Viele weitere Open-Source-Komponenten!

<a id="a-few-links"></a>
## Einige Links

- Wenn dir das Projekt gefällt, gib ihm gerne einen ⭐ und klick auf „watch“.
- Frage oder Vorschlag zur Roadmap oder zum Funktionsumfang? Komm in unseren [Discord-Kanal](https://discord.gg/NAb6H3UTjK) oder ins [Discussions](https://github.com/bluewave-labs/checkmate/discussions)-Forum.
- Du willst benachrichtigt werden, wenn ein neues Release rauskommt? [Newreleases](https://newreleases.io/) ist ein kostenloser Release-Tracker.
- Schau dir gerne ein [Installations- und Anwendungs-Video](https://www.youtube.com/watch?v=GfFOc0xHIwY) zu Checkmate an.

<a id="contributing"></a>
## Mitwirken

Wir sind [Alex](http://github.com/ajhollid) (Team-Lead), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) und [Karen](https://github.com/karenvicent) und helfen Einzelpersonen und Unternehmen dabei, ihre Infrastruktur und Server zu überwachen.

Wir sind stolz darauf, auf jeder Ebene starke Beziehungen zu unseren Beitragenden zu pflegen. Obwohl Checkmate ein junges Projekt ist, hat es bereits über 7.000 Sterne und mehr als 90 Beitragende aus aller Welt angezogen.

Mitarbeiterinnen und Mitarbeiter von **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes und NEC** haben unser Repository bereits gesternt — also keine falsche Zurückhaltung: mitmachen, beitragen und mit uns lernen!

So kannst du beitragen:

0. Gib dem Repo einen Stern :)
1. Lies den [Beitragsleitfaden](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Neulinge schauen am besten zuerst nach dem Tag `good-first-issue`.
2. Wenn du tiefer in die Architektur einsteigen willst, lies die ausführliche Struktur von [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate).
3. Öffne ein Issue, wenn du einen Bug findest.
4. Wenn du neu hier bist, schau dir die `good-first-issue`-Tasks an.
5. Mach einen Pull Request, um neue Funktionen einzubringen, die Nutzung zu verbessern oder Bugs zu fixen.
6. Schau dir den interaktiven Walkthrough durch die `Checkmate`-Codebasis auf CodeCanvas an: [hier](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Um bestehende Datenfluss-Simulationen zu verfeinern oder neue anzulegen, folge dem kurzen Tutorial [hier](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
