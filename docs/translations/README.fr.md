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


Ce dépôt contient à la fois le frontend et le backend de Checkmate, un outil de surveillance open source et auto-hébergeable permettant de suivre le matériel des serveurs, la disponibilité, les temps de réponse et les incidents en temps réel grâce à de belles visualisations. Checkmate vérifie régulièrement la disponibilité et le bon fonctionnement de vos serveurs ou sites web, et fournit des alertes et rapports en temps réel sur la disponibilité, les pannes et les temps de réponse des services surveillés.

Checkmate dispose aussi d'un agent, appelé [Capture](https://github.com/bluewave-labs/capture), pour récupérer des données depuis des serveurs distants. Capture n'est pas requis pour faire tourner Checkmate, mais il apporte des informations supplémentaires sur l'état du CPU, de la RAM, du disque et de la température de vos serveurs. Capture fonctionne sur Linux, Windows, Mac, Raspberry Pi ou tout appareil capable d'exécuter Go.

Checkmate a été testé en charge avec plus de 1 000 moniteurs actifs sans aucun problème ni goulet d'étranglement notable.

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

Vous pouvez voir la dernière version de [Checkmate](https://demo.checkmate.so/) en action.

L'identifiant est demouser@demo.com et le mot de passe Demouser1! (Note : nous mettons à jour le serveur de démo de temps en temps ; si cela ne fonctionne pas, faites-nous signe sur le canal Discussions).

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

Si vous devez surveiller des points d'accès HTTPS internes avec des certificats issus d'autorités de certification privées (comme Smallstep), consultez notre [guide de confiance d'autorité de certification personnalisée](../custom-ca-trust.md) pour les options de configuration Docker.

Pour plus de documentation, consultez le [répertoire docs](../).

<a id="performance"></a>
## Performance

Grâce à de nombreuses optimisations, Checkmate fonctionne avec une empreinte mémoire exceptionnellement faible, nécessitant un minimum de RAM et de CPU. Voici l'utilisation mémoire d'une instance Node.js sur un serveur qui surveille 323 serveurs chaque minute :

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Voici l'empreinte mémoire de MongoDB et Redis sur le même serveur (398 Mo et 15 Mo) pour le même nombre de serveurs :

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Questions & idées

Si vous avez des questions, suggestions ou commentaires, plusieurs options s'offrent à vous :

- [Canal Discord](https://discord.gg/NAb6H3UTjK) (préféré)
- [Discussions GitHub](https://github.com/bluewave-labs/Checkmate/discussions) (nous y passons de temps en temps)

N'hésitez pas à poser vos questions ou partager vos idées — nous adorerions vous entendre !

<a id="features"></a>
## Fonctionnalités

- Entièrement open source, déployable sur vos serveurs ou appareils personnels (par ex. Raspberry Pi 4 ou 5)
- Plusieurs options de surveillance : disponibilité, Docker, ping, SSL, port, serveur de jeu
- Surveillance de la vitesse des pages
- Surveillance de l'infrastructure (mémoire, utilisation du disque, performance CPU, réseau, etc.) — nécessite l'agent [Capture](https://github.com/bluewave-labs/capture)
  - Surveillance sélective du disque avec choix de points de montage
- Incidents en un coup d'œil
- Pages de statut avec 4 thèmes élégants
- Notifications par e-mail, webhooks, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Maintenance planifiée
- Surveillance par requête JSON
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

- Si vous souhaitez nous soutenir, merci de mettre une ⭐ et de cliquer sur « watch ».
- Une question ou une suggestion pour la roadmap ou les fonctionnalités ? Rejoignez notre [canal Discord](https://discord.gg/NAb6H3UTjK) ou les [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Besoin d'être notifié à chaque nouvelle version ? Utilisez [Newreleases](https://newreleases.io/), un service gratuit de suivi des sorties.
- Regardez une [vidéo d'installation et d'utilisation de Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Contribuer

Nous sommes [Alex](http://github.com/ajhollid) (chef d'équipe), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) et [Karen](https://github.com/karenvicent), et nous aidons les particuliers et les entreprises à surveiller leur infrastructure et leurs serveurs.

Nous sommes fiers de construire des liens solides avec les contributeurs à tous les niveaux. Bien que jeune, Checkmate a déjà obtenu plus de 7 000 étoiles et attiré plus de 90 contributeurs du monde entier.

Notre dépôt a été suivi par des employés de **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes et NEC** — alors n'hésitez pas, rejoignez-nous, contribuez et apprenez avec nous !

Voici comment contribuer :

0. Mettez une étoile à ce dépôt :)
1. Consultez le [guide du contributeur](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Les nouveaux contributeurs sont encouragés à consulter le tag `good-first-issue`.
2. Lisez une structure détaillée de [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) si vous souhaitez plonger dans l'architecture.
3. Ouvrez une issue si vous pensez avoir rencontré un bug.
4. Cherchez les `good-first-issue` si vous débutez.
5. Faites une pull request pour ajouter de nouvelles fonctionnalités, des améliorations ou corriger des bugs.
6. Découvrez ce parcours interactif de la base de code `Checkmate` sur CodeCanvas [ici](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Pour affiner les simulations de flux de données existantes ou en créer de nouvelles, suivez le tutoriel rapide [ici](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
