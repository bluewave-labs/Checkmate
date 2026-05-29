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

<p align="center"><strong>Une application open source de surveillance de la disponibilité et de l'infrastructure</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Ce dépôt contient le frontend et le backend de Checkmate, un outil de monitoring open source et auto-hébergeable qui suit en temps réel le matériel des serveurs, la disponibilité, les temps de réponse et les incidents avec des visualisations soignées. Checkmate vérifie périodiquement si vos serveurs ou sites web sont accessibles et performants, et envoie alertes et rapports en temps réel sur leur disponibilité, leurs interruptions et leurs temps de réponse.

Checkmate s'accompagne d'un agent appelé [Capture](https://github.com/bluewave-labs/capture), qui collecte des données depuis des serveurs distants. Capture n'est pas obligatoire, mais il apporte des informations supplémentaires sur le CPU, la RAM, le disque et la température de vos serveurs. Il tourne sous Linux, Windows, macOS, Raspberry Pi, ou n'importe quel appareil capable d'exécuter Go.

Checkmate a été testé sous charge avec plus de 1 000 moniteurs actifs, sans problème ni baisse de performance notable.

## 📚 Table des matières

- [📦 Démo](#demo)
- [🔗 Guide utilisateur](#users-guide)
- [🛠️ Installation](#installation)
- [🚀 Performance](#performance)
- [💚 Questions & idées](#questions--ideas)
- [🧩 Fonctionnalités](#features)
- [🏗️ Captures d'écran](#screenshots)
- [🏗️ Pile technique](#tech-stack)
- [🔗 Quelques liens](#a-few-links)
- [🤝 Contribuer](#contributing)


<a id="demo"></a>
## Démo

La dernière version de [Checkmate](https://demo.checkmate.so/) est consultable en ligne.

L'identifiant est demouser@demo.com et le mot de passe Demouser1!. (Le serveur de démo est mis à jour de temps en temps ; s'il est indisponible, dites-le-nous sur le canal Discussions.)

<a id="users-guide"></a>
## Guide utilisateur

Les instructions d'utilisation sont disponibles [ici](https://checkmate.so/docs).

## Prérequis
- [Docker](https://www.docker.com/) installé
- [Git](https://git-scm.com/) installé

<a id="installation"></a>
## Installation

Consultez les instructions d'installation dans le [portail de documentation Checkmate](https://checkmate.so/docs).

Vous pouvez également utiliser [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Afrique du Sud), [Cloudzy](https://cloudzy.com/marketplace/checkmate) ou [Pikapods](https://www.pikapods.com/) pour démarrer rapidement une instance Checkmate. Pour surveiller votre infrastructure serveur, vous aurez besoin de l'[agent Capture](https://github.com/bluewave-labs/capture). Le dépôt Capture contient également les instructions d'installation.

### Utiliser une autorité de certification personnalisée

Si vous devez surveiller des endpoints HTTPS internes dont les certificats sont signés par une autorité de certification privée (comme Smallstep), consultez notre [guide d'autorité de certification personnalisée](../custom-ca-trust.md) — il décrit les options de configuration Docker.

Pour plus de documentation, voyez le [répertoire docs](../).

<a id="performance"></a>
## Performance

Grâce à de nombreuses optimisations, Checkmate fonctionne avec une empreinte mémoire exceptionnellement faible et n'a besoin que de très peu de RAM et de CPU. Voici l'utilisation mémoire d'une instance Node.js sur un serveur qui surveille 323 serveurs chaque minute :

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Voici l'empreinte mémoire de MongoDB et Redis sur le même serveur (398 Mo et 15 Mo) pour le même nombre de serveurs :

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Questions & idées

Si vous avez des questions, suggestions ou commentaires, plusieurs options s'offrent à vous :

- [Canal Discord](https://discord.gg/NAb6H3UTjK) (préféré)
- [Discussions GitHub](https://github.com/bluewave-labs/Checkmate/discussions) (nous y passons de temps en temps)

N'hésitez pas à poser vos questions ou à partager vos idées — vos retours nous intéressent !

<a id="features"></a>
## Fonctionnalités

- Entièrement open source, déployable sur vos serveurs ou appareils personnels (par ex. Raspberry Pi 4 ou 5)
- Plusieurs types de monitoring : uptime, Docker, ping, SSL, port, serveur de jeu
- Monitoring de la vitesse des pages
- Monitoring d'infrastructure (mémoire, disque, CPU, réseau, etc.) — nécessite l'agent [Capture](https://github.com/bluewave-labs/capture)
  - Monitoring de disque sélectif via choix des points de montage
- Incidents en un coup d'œil
- Pages de statut avec 4 thèmes soignés
- Notifications par e-mail, webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Maintenance planifiée
- Monitoring via requête JSON
- Support multilingue : arabe, chinois (simplifié), chinois (traditionnel, Taïwan), tchèque, anglais, finnois, français, allemand, japonais, portugais (Brésil), russe, espagnol, thaï, turc, ukrainien et vietnamien


## Cycle de vie d'un moniteur

1. Un moniteur exécute une vérification (HTTP / ping / port / matériel via l'agent Capture)
2. Le résultat est stocké (succès/échec + temps de réponse)
3. Les résultats récents sont évalués par rapport au seuil de changement de statut configuré pour le moniteur
4. Si le seuil est atteint et que le statut actuel diffère du précédent, l'état du moniteur change (ex. `initializing`, `up`, `down`, `breached`)
5. Lors d'un changement d'état, un incident est créé ou résolu selon le statut actuel
6. Des notifications sont déclenchées selon la configuration

<a id="screenshots"></a>
## Captures d'écran

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
## Pile technique

- [ReactJs](https://react.dev/)
- [MUI (framework React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Beaucoup d'autres composants open source !

<a id="a-few-links"></a>
## Quelques liens

- Pour nous soutenir, laissez une ⭐ et cliquez sur « watch ».
- Une question ou une suggestion sur la roadmap ou les fonctionnalités ? Passez par notre [Discord](https://discord.gg/NAb6H3UTjK) ou par les [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Vous voulez être prévenu des nouvelles versions ? [Newreleases](https://newreleases.io/) est un service gratuit de suivi des sorties.
- Regardez une [vidéo d'installation et d'utilisation de Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY).

<a id="contributing"></a>
## Contribuer

Nous sommes [Alex](http://github.com/ajhollid) (chef d'équipe), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) et [Karen](https://github.com/karenvicent), et nous aidons particuliers et entreprises à monitorer leur infrastructure et leurs serveurs.

Nous tenons à construire des liens solides avec les contributeurs, quel que soit leur niveau. Bien que jeune, Checkmate a déjà dépassé 7 000 étoiles et attiré plus de 90 contributeurs partout dans le monde.

Notre dépôt est suivi par des employés de **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes et NEC** — alors lancez-vous, rejoignez-nous, contribuez et apprenez avec nous.

Comment contribuer :

0. Mettez une étoile à ce dépôt :)
1. Lisez le [guide du contributeur](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Si c'est votre première contribution, jetez d'abord un œil au tag `good-first-issue`.
2. Si vous voulez plonger dans l'architecture, lisez la [structure détaillée de Checkmate](https://deepwiki.com/bluewave-labs/Checkmate).
3. Ouvrez une issue si vous pensez avoir trouvé un bug.
4. Pour débuter, cherchez les tickets marqués `good-first-issue`.
5. Ouvrez une pull request pour ajouter une fonctionnalité, améliorer l'existant ou corriger un bug.
6. Parcourez la base de code `Checkmate` via la visite interactive sur CodeCanvas, [ici](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Pour affiner les simulations de flux de données existantes ou en créer de nouvelles, suivez le tutoriel rapide [ici](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
