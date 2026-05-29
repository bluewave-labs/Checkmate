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

<p align="center"><strong>Una aplicació de codi obert per a la monitorització de disponibilitat i infraestructura</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Aquest repositori conté tant el frontend com el backend de Checkmate, una eina de monitorització de codi obert i auto-allotjable per fer el seguiment del maquinari del servidor, la disponibilitat, els temps de resposta i els incidents en temps real amb visualitzacions atractives. Checkmate comprova regularment si un servidor o lloc web és accessible i funciona correctament, i ofereix alertes i informes en temps real sobre la disponibilitat, les caigudes i els temps de resposta dels serveis monitoritzats.

Checkmate també disposa d'un agent anomenat [Capture](https://github.com/bluewave-labs/capture) per recuperar dades de servidors remots. Tot i que Capture no és necessari per executar Checkmate, proporciona informació addicional sobre l'estat de la CPU, la RAM, el disc i la temperatura dels servidors. Capture pot executar-se a Linux, Windows, Mac, Raspberry Pi o qualsevol dispositiu capaç d'executar Go.

Checkmate s'ha provat sota càrrega amb més de 1.000 monitors actius sense cap problema o coll d'ampolla notable.

## 📚 Taula de continguts

- [📦 Demo](#demo)
- [🔗 Guia d'usuari](#users-guide)
- [🛠️ Instal·lació](#installation)
- [🚀 Rendiment](#performance)
- [💚 Preguntes i idees](#questions--ideas)
- [🧩 Funcionalitats](#features)
- [🏗️ Captures de pantalla](#screenshots)
- [🏗️ Stack tecnològic](#tech-stack)
- [🔗 Alguns enllaços](#a-few-links)
- [🤝 Contribuir](#contributing)


## Demo

Pots veure la darrera versió de [Checkmate](https://demo.checkmate.so/) en acció.

L'usuari és demouser@demo.com i la contrasenya és Demouser1! (Nota: actualitzem el servidor de demostració de tant en tant; si no funciona, escriu-nos al canal Discussions).

## Guia d'usuari

Pots trobar les instruccions d'ús [aquí](https://checkmate.so/docs).

## Requisits previs
- [Docker](https://www.docker.com/) instal·lat
- [Git](https://git-scm.com/) instal·lat

## Instal·lació

Consulta les instruccions d'instal·lació al [portal de documentació de Checkmate](https://checkmate.so/docs).

Alternativament, també pots utilitzar [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Sud-àfrica), [Cloudzy](https://cloudzy.com/marketplace/checkmate) o [Pikapods](https://www.pikapods.com/) per posar en marxa ràpidament una instància de Checkmate. Si vols monitoritzar la infraestructura de servidors, necessitaràs l'[agent Capture](https://github.com/bluewave-labs/capture). El repositori de Capture també conté les instruccions d'instal·lació.

### Utilitzar una CA personalitzada

Si necessites monitoritzar punts HTTPS interns amb certificats d'autoritats certificadores privades (com Smallstep), consulta la nostra [Guia de confiança per a CA personalitzades](../custom-ca-trust.md) per a les opcions de configuració de Docker.

Per a més documentació, consulta el [directori docs](../).

## Rendiment

Gràcies a una optimització exhaustiva, Checkmate funciona amb un consum de memòria excepcionalment baix, requerint un mínim de RAM i CPU. Aquí tens l'ús de memòria d'una instància de Node.js en un servidor que monitoritza 323 servidors cada minut:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Aquí pots veure la petjada de memòria de MongoDB i Redis al mateix servidor (398 MB i 15 MB) per al mateix nombre de servidors:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

## Preguntes i idees

Si tens preguntes, suggeriments o comentaris, tens diverses opcions:

- [Canal de Discord](https://discord.gg/NAb6H3UTjK) (preferit)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (hi entrem de tant en tant)

No dubtis a preguntar o compartir les teves idees — ens encantarà tenir notícies teves!

## Funcionalitats

- Totalment de codi obert, desplegable als teus servidors o dispositius domèstics (per ex. Raspberry Pi 4 o 5)
- Diverses opcions de monitorització: disponibilitat, Docker, ping, SSL, port, servidor de jocs
- Monitorització de velocitat de pàgina
- Monitorització d'infraestructura (memòria, ús de disc, rendiment de CPU, xarxa, etc.) — requereix l'agent [Capture](https://github.com/bluewave-labs/capture)
  - Monitorització selectiva de disc amb selecció de punts de muntatge
- Incidents amb un cop d'ull
- Pàgines d'estat amb 4 temes elegants
- Notificacions per correu electrònic, webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Manteniment programat
- Monitorització mitjançant consultes JSON
- Suport multilingüe per a àrab, xinès (simplificat), xinès (tradicional, Taiwan), txec, anglès, finès, francès, alemany, japonès, portuguès (Brasil), rus, espanyol, tailandès, turc, ucraïnès i vietnamita


## Cicle de vida d'un monitor

1. Un monitor executa una comprovació (HTTP / ping / port / maquinari mitjançant l'agent Capture)
2. El resultat es desa (èxit/fracàs + temps de resposta)
3. Els resultats recents s'avaluen contra el llindar de canvi d'estat configurat al monitor
4. Si s'assoleix el llindar i l'estat actual difereix de l'anterior, l'estat del monitor canvia (per ex. `initializing`, `up`, `down`, `breached`)
5. En un canvi d'estat, es crea o resol un incident, segons l'estat actual del monitor
6. Es disparen les notificacions segons la configuració

## Captures de pantalla

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



## Stack tecnològic

- [ReactJs](https://react.dev/)
- [MUI (framework de React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- I molts altres components de codi obert!

## Alguns enllaços

- Si vols donar-nos suport, considera donar-nos una ⭐ i prémer "watch".
- Tens alguna pregunta o suggeriment per al roadmap o les funcionalitats? Visita el nostre [canal de Discord](https://discord.gg/NAb6H3UTjK) o el fòrum de [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Vols rebre una notificació quan hi hagi una nova versió? Utilitza [Newreleases](https://newreleases.io/), un servei gratuït per seguir versions.
- Mira un [vídeo d'instal·lació i ús de Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

## Contribuir

Som l'[Alex](http://github.com/ajhollid) (líder d'equip), en [Gorkem](http://github.com/gorkem-bwl/), l'[Aryaman](https://github.com/Br0wnHammer), en [Mert](https://github.com/mertssmnoglu) i la [Karen](https://github.com/karenvicent), i ajudem persones i empreses a monitoritzar la seva infraestructura i els seus servidors.

Ens enorgullim de construir vincles forts amb els col·laboradors a tots els nivells. Tot i ser un projecte jove, Checkmate ja ha aconseguit més de 7.000 estrelles i ha atret més de 90 col·laboradors d'arreu del món.

El nostre repositori té estrelles d'empleats de **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes i NEC** — no t'estiguis de res: uneix-te, contribueix i aprèn amb nosaltres!

Així pots contribuir:

0. Posa una estrella a aquest repositori :)
1. Consulta la [guia per a col·laboradors](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Recomanem als principiants revisar l'etiqueta `good-first-issue`.
2. Llegeix una estructura detallada de [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) si vols aprofundir en l'arquitectura.
3. Obre una issue si creus que has trobat un error.
4. Mira els `good-first-issue` si ets nou.
5. Fes una pull request per afegir noves funcionalitats, millores de qualitat o solucions a errors.
6. Fes una ullada al recorregut interactiu del codi de `Checkmate` a CodeCanvas [aquí](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Per refinar simulacions de flux de dades existents o crear-ne de noves, segueix el tutorial ràpid [aquí](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
