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

> ⚠️ Tento překlad je strojový koncept. Revize od rodilých mluvčích jsou vítány formou pull requestu.


![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Open source aplikace pro monitorování dostupnosti a infrastruktury</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Tento repozitář obsahuje jak frontend, tak backend Checkmate, open source, samohostovatelného monitorovacího nástroje pro sledování hardwaru serveru, dostupnosti, doby odezvy a incidentů v reálném čase s krásnými vizualizacemi. Checkmate pravidelně kontroluje, zda je server/web dostupný a zda funguje optimálně, a poskytuje upozornění a zprávy o dostupnosti, výpadcích a době odezvy monitorovaných služeb v reálném čase.

Checkmate má také agenta zvaného [Capture](https://github.com/bluewave-labs/capture), který získává data ze vzdálených serverů. Capture není pro běh Checkmate povinný, ale poskytuje další informace o stavu CPU, RAM, disku a teploty serverů. Capture lze provozovat na Linuxu, Windows, Macu, Raspberry Pi nebo jakémkoli zařízení, které dokáže spouštět Go.

Checkmate byl zátěžově otestován s více než 1000 aktivními monitory bez jakýchkoli problémů nebo výkonnostních úzkých míst.

## 📚 Obsah

- [📦 Demo](#demo)
- [🔗 Uživatelská příručka](#users-guide)
- [🛠️ Instalace](#installation)
- [🚀 Výkon](#performance)
- [💚 Dotazy & nápady](#questions--ideas)
- [🧩 Funkce](#features)
- [🏗️ Snímky obrazovky](#screenshots)
- [🏗️ Technologie](#tech-stack)
- [🔗 Několik odkazů](#a-few-links)
- [🤝 Přispívání](#contributing)


<a id="demo"></a>
## Demo

Nejnovější sestavení [Checkmate](https://demo.checkmate.so/) si můžete vyzkoušet v akci.

Uživatelské jméno je demouser@demo.com a heslo Demouser1! (Poznámka: demo server čas od času aktualizujeme; pokud něco nefunguje, dejte nám prosím vědět na kanále Discussions).

<a id="users-guide"></a>
## Uživatelská příručka

Pokyny k použití najdete [zde](https://checkmate.so/docs).

## Předpoklady
- Nainstalovaný [Docker](https://www.docker.com/)
- Nainstalovaný [Git](https://git-scm.com/)

<a id="installation"></a>
## Instalace

Pokyny k instalaci najdete v [dokumentačním portálu Checkmate](https://checkmate.so/docs).

Případně můžete použít [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Jižní Afrika), [Cloudzy](https://cloudzy.com/marketplace/checkmate) nebo [Pikapods](https://www.pikapods.com/) pro rychlé spuštění instance Checkmate. Pokud chcete monitorovat infrastrukturu serverů, budete potřebovat [agenta Capture](https://github.com/bluewave-labs/capture). Repozitář Capture obsahuje také pokyny k instalaci.

### Použití vlastní CA

Pokud potřebujete monitorovat interní HTTPS endpointy s certifikáty od soukromých certifikačních autorit (jako je Smallstep), přečtěte si naši [příručku pro důvěřování vlastním CA](../custom-ca-trust.md) pro možnosti konfigurace Dockeru.

Další dokumentaci najdete v [adresáři docs](../).

<a id="performance"></a>
## Výkon

Díky rozsáhlým optimalizacím funguje Checkmate s mimořádně malým paměťovým otiskem a vyžaduje jen minimum paměti a CPU. Zde je využití paměti instance Node.js na serveru, který každou minutu monitoruje 323 serverů:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

A zde paměťový otisk MongoDB a Redis na stejném serveru (398 MB, resp. 15 MB) pro stejný počet serverů:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Dotazy & nápady

Pokud máte dotazy, návrhy nebo komentáře, máte několik možností:

- [Discord kanál](https://discord.gg/NAb6H3UTjK) (preferováno)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (kontrolujeme čas od času)

Neváhejte se ptát nebo sdílet své nápady — moc rádi vás slyšíme!

<a id="features"></a>
## Funkce

- Plně open source, nasaditelné na vlastních serverech nebo domácích zařízeních (např. Raspberry Pi 4 nebo 5)
- Několik způsobů monitorování: dostupnost, Docker, ping, SSL, port, herní server
- Monitorování rychlosti stránek
- Monitorování infrastruktury (paměť, využití disku, výkon CPU, síť atd.) — vyžaduje agenta [Capture](https://github.com/bluewave-labs/capture)
  - Selektivní monitorování disků s výběrem přípojných bodů
- Incidenty na první pohled
- Stavové stránky se 4 elegantními tématy
- Notifikace přes e-mail, webhooky, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Plánovaná údržba
- Monitorování pomocí JSON dotazů
- Vícejazyčná podpora pro arabštinu, čínštinu (zjednodušenou), čínštinu (tradiční, Tchaj-wan), češtinu, angličtinu, finštinu, francouzštinu, němčinu, japonštinu, portugalštinu (Brazílie), ruštinu, španělštinu, thajštinu, turečtinu, ukrajinštinu a vietnamštinu


## Životní cyklus monitoru

1. Monitor provede kontrolu (HTTP / ping / port / hardware přes agenta Capture)
2. Výsledek se uloží (úspěch/neúspěch + doba odezvy)
3. Nedávné výsledky se vyhodnotí proti nastavenému prahu změny stavu monitoru
4. Pokud je prah dosažen a aktuální stav se liší od předchozího, změní se stav monitoru (např. `initializing`, `up`, `down`, `breached`)
5. Při změně stavu se podle aktuálního stavu vytvoří nebo vyřeší incident
6. Notifikace se spouštějí podle konfigurace

<a id="screenshots"></a>
## Snímky obrazovky

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
## Technologie

- [ReactJs](https://react.dev/)
- [MUI (React framework)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- A mnoho dalších open source komponent!

<a id="a-few-links"></a>
## Několik odkazů

- Pokud nás chcete podpořit, zvažte přidělení ⭐ a kliknutí na „watch“.
- Máte dotaz nebo návrh na roadmapu/funkce? Podívejte se na náš [Discord kanál](https://discord.gg/NAb6H3UTjK) nebo fórum [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Chcete být upozorněni na nové vydání? Použijte [Newreleases](https://newreleases.io/), bezplatnou službu pro sledování vydání.
- Podívejte se na [instalační a uživatelské video Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Přispívání

Jsme [Alex](http://github.com/ajhollid) (vedoucí týmu), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) a [Karen](https://github.com/karenvicent) a pomáháme jednotlivcům a firmám monitorovat jejich infrastrukturu a servery.

Jsme hrdí na to, že budujeme silné vztahy s přispěvateli na všech úrovních. Přestože jsme mladý projekt, Checkmate už získal přes 7000 hvězdiček a přilákal více než 90 přispěvatelů z celého světa.

Náš repozitář mají označený zaměstnanci společností **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes a NEC** — takže neváhejte, zapojte se, přispějte a učte se s námi!

Jak přispět:

0. Dejte tomuto repozitáři hvězdičku :)
1. Přečtěte si [pokyny pro přispěvatele](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Začátečníkům doporučujeme prohlédnout si štítek `good-first-issue`.
2. Pokud chcete proniknout do architektury, přečtěte si podrobnou strukturu [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate).
3. Otevřete issue, pokud se domníváte, že jste narazili na chybu.
4. Pokud jste nováček, podívejte se po `good-first-issue`.
5. Vytvořte pull request pro přidání funkcí, drobná vylepšení nebo opravy chyb.
6. Vyzkoušejte interaktivní průchod kódovou základnou `Checkmate` na CodeCanvas [zde](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Pro vylepšení existujících simulací datových toků nebo vytvoření nových postupujte podle krátkého tutoriálu [zde](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
