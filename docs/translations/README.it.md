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

<p align="center"><strong>Un'applicazione open source per il monitoraggio di uptime e infrastruttura</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Questo repository contiene sia il frontend che il backend di Checkmate, uno strumento di monitoraggio open source e self-hosted per tenere sotto controllo l'hardware dei server, l'uptime, i tempi di risposta e gli incidenti in tempo reale, con visualizzazioni accattivanti. Checkmate verifica regolarmente se un server o un sito web è raggiungibile e funziona in modo ottimale, fornendo avvisi e report in tempo reale su disponibilità, tempi di inattività e tempi di risposta dei servizi monitorati.

Checkmate dispone anche di un agente, chiamato [Capture](https://github.com/bluewave-labs/capture), per raccogliere dati dai server remoti. Anche se Capture non è necessario per far funzionare Checkmate, offre informazioni aggiuntive su CPU, RAM, disco e temperatura dei tuoi server. Capture può essere eseguito su Linux, Windows, Mac, Raspberry Pi o qualsiasi altro dispositivo in grado di eseguire Go.

Checkmate è stato sottoposto a stress test con oltre 1000 monitor attivi senza problemi particolari né colli di bottiglia nelle prestazioni.

## 📚 Indice

- [📦 Demo](#demo)  
- [🔗 Guida utente](#users-guide)  
- [🛠️ Installazione](#installation)
- [🚀 Prestazioni](#performance)  
- [💚 Domande e idee](#questions--ideas)  
- [🧩 Funzionalità](#features)  
- [🏗️ Screenshot](#screenshots)  
- [🏗️ Tech stack](#tech-stack)  
- [🔗 Alcuni link](#a-few-links)  
- [🤝 Come contribuire](#contributing)  


<a id="demo"></a>
## Demo

Puoi vedere l'ultima build di [Checkmate](https://demo.checkmate.so/) in azione. 

Il nome utente è demouser@demo.com e la password è Demouser1! (una nota: aggiorniamo il server demo di tanto in tanto, quindi se non dovesse funzionare, scrivici sul canale Discussions).

<a id="users-guide"></a>
## Guida utente

Le istruzioni per l'uso sono disponibili [qui](https://checkmate.so/docs). 

## Prerequisiti
- [Docker](https://www.docker.com/) installato
- [Git](https://git-scm.com/) installato

<a id="installation"></a>
## Installazione

Consulta le istruzioni di installazione nel [portale della documentazione di Checkmate](https://checkmate.so/docs). 

In alternativa, puoi usare [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](../../charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Sudafrica), [Cloudzy](https://cloudzy.com/marketplace/checkmate) o [Pikapods](https://www.pikapods.com/) per creare rapidamente un'istanza di Checkmate. Se desideri monitorare l'infrastruttura dei tuoi server, ti servirà l'[agente Capture](https://github.com/bluewave-labs/capture). Anche il repository di Capture contiene le istruzioni di installazione.

### Usare una CA personalizzata

Se hai bisogno di monitorare endpoint HTTPS interni con certificati emessi da Autorità di Certificazione (CA) private (come Smallstep), consulta la nostra [Guida all'attendibilità delle CA personalizzate](../custom-ca-trust.md) per le opzioni di configurazione di Docker.

Per ulteriore documentazione, consulta la [cartella docs](../).

<a id="performance"></a>
## Prestazioni

Grazie a numerose ottimizzazioni, Checkmate opera con un consumo di memoria estremamente ridotto, richiedendo risorse minime di memoria e CPU. Ecco l'utilizzo di memoria di un'istanza Node.js in esecuzione su un server che monitora 323 server ogni minuto:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Puoi vedere il consumo di memoria di MongoDB e Redis sullo stesso server (398Mb e 15Mb) per lo stesso numero di server:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Domande e idee

Se hai domande, suggerimenti o commenti, hai diverse opzioni: 

- [Canale Discord](https://discord.gg/NAb6H3UTjK) (preferito)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (controlliamo di tanto in tanto)

Non esitare a fare domande o a condividere le tue idee: ci farebbe piacere sentirti!

<a id="features"></a>
## Funzionalità

- Completamente open source, distribuibile sui tuoi server o su dispositivi domestici (es. Raspberry Pi 4 o 5)
- Diverse opzioni di monitoraggio: Uptime, Docker, Ping, SSL, Port, Game server
- Monitoraggio della velocità delle pagine
- Monitoraggio dell'infrastruttura (memoria, utilizzo del disco, prestazioni della CPU, rete, ecc.) - richiede l'agente [Capture](https://github.com/bluewave-labs/capture)
  - Monitoraggio selettivo dei dischi con selezione del mountpoint
- Incidenti a colpo d'occhio
- Pagine di stato con 4 temi curati
- Notifiche via E-mail, Webhook, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Manutenzione programmata
- Monitoraggio tramite query JSON
- Supporto multilingua per arabo, cinese (semplificato), cinese (tradizionale, Taiwan), ceco, inglese, finlandese, francese, tedesco, giapponese, portoghese (Brasile), russo, spagnolo, thailandese, turco, ucraino e vietnamita


## Ciclo di vita del monitor

1. Un monitor esegue un controllo (HTTP / ping / port / hardware tramite l'agente Capture)
2. Il risultato viene memorizzato (successo/errore + tempo di risposta)
3. I risultati dei controlli recenti vengono valutati rispetto alla soglia di cambio stato configurata per il monitor
4. Se la soglia di cambio stato del monitor viene raggiunta e lo stato attuale è diverso da quello precedente, lo stato del monitor cambia (es. `initializing`, `up`, `down`, `breached`)
5. Al cambio di stato: viene creato o risolto un incidente, a seconda dello stato attuale del monitor
6. Le notifiche vengono attivate in base alla configurazione

<a id="screenshots"></a>
## Screenshot

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
## Tech stack

- [ReactJs](https://react.dev/)
- [MUI (framework React)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Tanti altri componenti open source!

<a id="a-few-links"></a>
## Alcuni link

- Se vuoi supportarci, valuta di lasciare una ⭐ e di cliccare su "watch".
- Hai una domanda o un suggerimento per la roadmap o le funzionalità? Dai un'occhiata al nostro [canale Discord](https://discord.gg/NAb6H3UTjK) o al forum [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Vuoi ricevere una notifica quando esce una nuova release? Usa [Newreleases](https://newreleases.io/), un servizio gratuito per tenere traccia delle release.
- Guarda un [video di installazione e utilizzo](https://www.youtube.com/watch?v=GfFOc0xHIwY) di Checkmate

<a id="contributing"></a>
## Come contribuire

Siamo [Alex](http://github.com/ajhollid) (team lead), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) e [Karen](https://github.com/karenvicent), e aiutiamo privati e aziende a monitorare la propria infrastruttura e i propri server.

Siamo orgogliosi di costruire legami solidi con i contributori a ogni livello. Pur essendo un progetto giovane, Checkmate ha già raccolto oltre 7000 stelle e attirato più di 90 contributori da tutto il mondo.

Il nostro repository ha ricevuto una stella da dipendenti di **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes e NEC**, quindi non trattenerti: unisciti a noi, contribuisci e impara con noi!

Ecco come puoi contribuire:

0. Metti una stella a questo repository :)
1. Consulta la [guida per i contributori](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Chi è alle prime armi è incoraggiato a controllare il tag `good-first-issue`.
2. Leggi una descrizione dettagliata della struttura di [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) se vuoi approfondire l'architettura.
3. Apri una issue se pensi di aver trovato un bug.
4. Se sei un nuovo arrivato, dai un'occhiata alle good-first-issue.
5. Apri una pull request per aggiungere nuove funzionalità, apportare miglioramenti dell'esperienza d'uso o correggere bug.
6. Dai un'occhiata a questa guida interattiva alla codebase di `Checkmate` su CodeCanvas [qui](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Per perfezionare le simulazioni di flusso dati esistenti o crearne di nuove, segui il breve tutorial [qui](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)

