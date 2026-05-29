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

<p align="center"><strong>Eine Open-Source-Anwendung zur Überwachung von Verfügbarkeit und Infrastruktur</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Dieses Repository enthält sowohl das Frontend als auch das Backend von Checkmate, einem Open-Source- und selbst gehosteten Überwachungstool zum Verfolgen von Server-Hardware, Verfügbarkeit, Antwortzeiten und Vorfällen in Echtzeit mit ansprechenden Visualisierungen. Checkmate prüft regelmäßig, ob ein Server oder eine Website erreichbar ist und optimal funktioniert, und liefert Echtzeit-Warnungen sowie Berichte zu Verfügbarkeit, Ausfallzeiten und Antwortzeiten der überwachten Dienste.

Checkmate hat außerdem einen Agenten namens [Capture](https://github.com/bluewave-labs/capture), um Daten von entfernten Servern abzurufen. Capture ist für den Betrieb von Checkmate nicht zwingend erforderlich, liefert aber zusätzliche Einblicke in CPU, RAM, Festplatte und Temperatur Ihrer Server. Capture läuft auf Linux, Windows, Mac, Raspberry Pi oder jedem anderen Gerät, das Go ausführen kann.

Checkmate wurde mit über 1.000 aktiven Monitoren ohne nennenswerte Probleme oder Leistungseinbußen erfolgreich getestet.

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


## Demo

Sie können den neuesten Build von [Checkmate](https://demo.checkmate.so/) live ausprobieren.

Der Benutzername lautet demouser@demo.com und das Passwort ist Demouser1! (Hinweis: wir aktualisieren den Demo-Server gelegentlich; falls etwas nicht funktioniert, melden Sie sich bitte im Discussions-Kanal).

## Benutzerhandbuch

Eine Nutzungsanleitung finden Sie [hier](https://checkmate.so/docs).

## Voraussetzungen
- [Docker](https://www.docker.com/) installiert
- [Git](https://git-scm.com/) installiert

## Installation

Die Installationsanleitung finden Sie im [Dokumentationsportal von Checkmate](https://checkmate.so/docs).

Alternativ können Sie auch [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Südafrika), [Cloudzy](https://cloudzy.com/marketplace/checkmate) oder [Pikapods](https://www.pikapods.com/) verwenden, um schnell eine Checkmate-Instanz aufzusetzen. Wenn Sie Ihre Server-Infrastruktur überwachen möchten, benötigen Sie den [Capture-Agenten](https://github.com/bluewave-labs/capture). Das Capture-Repository enthält ebenfalls die Installationsanleitung.

### Verwendung einer benutzerdefinierten CA

Wenn Sie interne HTTPS-Endpunkte mit Zertifikaten von privaten Zertifizierungsstellen (wie Smallstep) überwachen müssen, lesen Sie unseren [Leitfaden für vertrauenswürdige benutzerdefinierte CAs](../custom-ca-trust.md) für Docker-Konfigurationsoptionen.

Weitere Dokumentation finden Sie im [docs-Verzeichnis](../).

## Leistung

Dank umfangreicher Optimierungen läuft Checkmate mit einem außergewöhnlich geringen Speicherverbrauch und benötigt nur minimale RAM- und CPU-Ressourcen. Hier sehen Sie den Speicherverbrauch einer Node.js-Instanz auf einem Server, der 323 Server jede Minute überwacht:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Hier der Speicherverbrauch von MongoDB und Redis auf demselben Server (398 MB bzw. 15 MB) für dieselbe Anzahl von Servern:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

## Fragen & Ideen

Wenn Sie Fragen, Vorschläge oder Anmerkungen haben, stehen Ihnen mehrere Möglichkeiten offen:

- [Discord-Kanal](https://discord.gg/NAb6H3UTjK) (bevorzugt)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (wir schauen dort von Zeit zu Zeit vorbei)

Stellen Sie gerne Fragen oder teilen Sie Ihre Ideen — wir freuen uns auf Ihr Feedback!

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



## Tech-Stack

- [ReactJs](https://react.dev/)
- [MUI (React-Framework)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Viele weitere Open-Source-Komponenten!

## Einige Links

- Wenn Sie uns unterstützen möchten, geben Sie dem Projekt gerne einen ⭐ und klicken Sie auf „watch“.
- Haben Sie eine Frage oder einen Vorschlag zur Roadmap oder zum Funktionsumfang? Schauen Sie in unseren [Discord-Kanal](https://discord.gg/NAb6H3UTjK) oder ins [Discussions](https://github.com/bluewave-labs/checkmate/discussions)-Forum.
- Sie möchten benachrichtigt werden, wenn es ein neues Release gibt? Nutzen Sie [Newreleases](https://newreleases.io/), einen kostenlosen Dienst zum Verfolgen von Releases.
- Sehen Sie sich ein [Installations- und Anwendungs-Video](https://www.youtube.com/watch?v=GfFOc0xHIwY) zu Checkmate an.

## Mitwirken

Wir sind [Alex](http://github.com/ajhollid) (Team-Lead), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) und [Karen](https://github.com/karenvicent) und helfen Einzelpersonen und Unternehmen dabei, ihre Infrastruktur und Server zu überwachen.

Wir sind stolz darauf, auf jeder Ebene starke Beziehungen zu unseren Beitragenden zu pflegen. Obwohl Checkmate ein junges Projekt ist, hat es bereits über 7.000 Sterne und mehr als 90 Beitragende aus aller Welt angezogen.

Unser Repository ist mit Sternen von Mitarbeitern aus **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes und NEC** versehen — zögern Sie also nicht, mitzumachen, beizutragen und gemeinsam mit uns zu lernen!

So können Sie beitragen:

0. Diesem Repo einen Stern geben :)
1. Lesen Sie den [Beitragsleitfaden](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Neueinsteigende sind eingeladen, das Tag `good-first-issue` zu prüfen.
2. Lesen Sie die detaillierte Struktur von [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate), wenn Sie tiefer in die Architektur einsteigen möchten.
3. Öffnen Sie ein Issue, wenn Sie auf einen Bug stoßen.
4. Schauen Sie sich `good-first-issue`-Einträge an, wenn Sie neu sind.
5. Reichen Sie einen Pull Request ein, um neue Funktionen hinzuzufügen, Qualitätsverbesserungen vorzunehmen oder Bugs zu beheben.
6. Erkunden Sie diesen interaktiven Walkthrough der `Checkmate`-Codebasis auf CodeCanvas [hier](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Um vorhandene Datenfluss-Simulationen zu verfeinern oder neue zu erstellen, folgen Sie dem Schnelltutorial [hier](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
