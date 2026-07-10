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

> ⚠️ Tämä käännös on konekäännöksen luonnos. Äidinkielisten puhujien tarkistuksia otetaan mielellään vastaan pull requestilla.


![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Avoimen lähdekoodin sovellus saatavuuden ja infrastruktuurin valvontaan</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Tämä repositorio sisältää Checkmaten frontendin ja backendin — avoimen lähdekoodin, itse isännöitävän valvontatyökalun, jolla seurataan reaaliaikaisesti palvelinten laitteistoa, saatavuutta, vasteaikoja ja häiriöitä näyttävien visualisointien avulla. Checkmate tarkistaa säännöllisesti, ovatko palvelin tai sivusto tavoitettavissa ja toimivatko ne odotetusti, sekä antaa reaaliaikaisia hälytyksiä ja raportteja valvottujen palvelujen saatavuudesta, käyttökatkoista ja vasteajoista.

Checkmatella on myös agentti nimeltä [Capture](https://github.com/bluewave-labs/capture), joka kerää tietoja etäpalvelimilta. Capture ei ole välttämätön Checkmaten ajamiseen, mutta se tarjoaa lisätietoja palvelimiesi CPU:n, RAM-muistin, levyn ja lämpötilan tilasta. Capture toimii Linuxissa, Windowsissa, Macissa, Raspberry Pissä ja kaikissa Go-yhteensopivissa laitteissa.

Checkmate on rasitustestattu yli 1000 aktiivisella valvomolla ilman merkittäviä ongelmia tai suorituskykypullonkauloja.

## 📚 Sisällysluettelo

- [📦 Demo](#demo)
- [🔗 Käyttöopas](#users-guide)
- [🛠️ Asennus](#installation)
- [🚀 Suorituskyky](#performance)
- [💚 Kysymykset & ideat](#questions--ideas)
- [🧩 Ominaisuudet](#features)
- [🏗️ Kuvakaappaukset](#screenshots)
- [🏗️ Teknologiat](#tech-stack)
- [🔗 Muutamia linkkejä](#a-few-links)
- [🤝 Osallistuminen](#contributing)


<a id="demo"></a>
## Demo

Voit kokeilla uusinta [Checkmate-versiota](https://demo.checkmate.so/) käytännössä.

Käyttäjätunnus on demouser@demo.com ja salasana Demouser1! (Huom: päivitämme demopalvelinta ajoittain; jos se ei toimi, kerro meille Discussions-kanavalla).

<a id="users-guide"></a>
## Käyttöopas

Käyttöohjeet löytyvät [täältä](https://checkmate.so/docs).

## Esivaatimukset
- [Docker](https://www.docker.com/) asennettuna
- [Git](https://git-scm.com/) asennettuna

<a id="installation"></a>
## Asennus

Asennusohjeet löytyvät [Checkmaten dokumentaatioportaalista](https://checkmate.so/docs).

Vaihtoehtoisesti voit käyttää [Coolifya](https://coolify.io/), [Elestiota](https://elest.io/open-source/checkmate), [K8s:ää](./charts/helm/checkmate/INSTALLATION.md), [Sive Hostia](https://sive.host) (Etelä-Afrikka), [Cloudzya](https://cloudzy.com/marketplace/checkmate) tai [Pikapodsia](https://www.pikapods.com/) Checkmate-instanssin nopeaan käynnistämiseen. Jos haluat valvoa palvelininfrastruktuuriasi, tarvitset [Capture-agentin](https://github.com/bluewave-labs/capture). Capturen repositorio sisältää myös sen asennusohjeet.

### Mukautetun CA:n käyttö

Jos haluat valvoa sisäisiä HTTPS-päätepisteitä yksityisten varmenneauktoriteettien (kuten Smallstepin) varmenteilla, lue [mukautetun CA:n luottamusopas](../custom-ca-trust.md) Dockerin konfigurointivaihtoehdoista.

Lisää dokumentaatiota löydät [docs-hakemistosta](../).

<a id="performance"></a>
## Suorituskyky

Laajojen optimointien ansiosta Checkmate toimii poikkeuksellisen pienellä muistinkulutuksella ja vaatii minimaalisesti muistia ja CPU:ta. Tässä Node.js-instanssin muistinkulutus palvelimella, joka valvoo 323 palvelinta minuutin välein:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Ja tässä MongoDB:n ja Redisin muistijälki samalla palvelimella (398 Mt ja 15 Mt) samalle palvelinmäärälle:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Kysymykset & ideat

Jos sinulla on kysymyksiä, ehdotuksia tai kommentteja, vaihtoehtoja on useita:

- [Discord-kanava](https://discord.gg/NAb6H3UTjK) (suositeltu)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (katsomme aika ajoin)

Kysy rohkeasti tai jaa ideoitasi — kuulemme sinusta mielellämme!

<a id="features"></a>
## Ominaisuudet

- Täysin avoimen lähdekoodin, asennettavissa omille palvelimille tai kotilaitteille (esim. Raspberry Pi 4 tai 5)
- Useita valvontavaihtoehtoja: saatavuus, Docker, ping, SSL, portti, pelipalvelin
- Sivunopeuden valvonta
- Infrastruktuurin valvonta (muisti, levyn käyttö, CPU:n suorituskyky, verkko jne.) — vaatii [Capture](https://github.com/bluewave-labs/capture)-agentin
  - Valikoitu levyjen valvonta liitospisteen valinnalla
- Häiriöt yhdellä silmäyksellä
- Tilasivut neljällä tyylikkäällä teemalla
- Ilmoitukset sähköpostitse, webhookeilla, Discordilla, Slackilla, PagerDutylla, Matrixilla, Microsoft Teamsilla, Telegramilla, Pushoverilla ja Twiliolla (SMS)
- Ajastettu huolto
- JSON-kyselyihin perustuva valvonta
- Monikielinen tuki: arabia, kiina (yksinkertaistettu), kiina (perinteinen, Taiwan), tšekki, englanti, suomi, ranska, saksa, japani, portugali (Brasilia), venäjä, espanja, thai, turkki, ukraina ja vietnam


## Monitorin elinkaari

1. Monitori suorittaa tarkistuksen (HTTP / ping / portti / laitteisto Capture-agentin kautta)
2. Tulos tallennetaan (onnistui/epäonnistui + vasteaika)
3. Viimeaikaisia tuloksia arvioidaan monitorin asetettua tilamuutoskynnystä vasten
4. Jos kynnys täyttyy ja nykyinen tila eroaa edellisestä, monitorin tila muuttuu (esim. `initializing`, `up`, `down`, `breached`)
5. Tilamuutoksen yhteydessä häiriö joko luodaan tai ratkaistaan monitorin nykyisen tilan mukaan
6. Ilmoitukset laukaistaan asetusten mukaisesti

<a id="screenshots"></a>
## Kuvakaappaukset

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
## Teknologiat

- [ReactJs](https://react.dev/)
- [MUI (React-kehys)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Ja monia muita avoimen lähdekoodin komponentteja!

<a id="a-few-links"></a>
## Muutamia linkkejä

- Jos haluat tukea meitä, harkitse ⭐ antamista ja "watch"-napin painamista.
- Onko kysymyksiä tai ehdotuksia tiekartasta/ominaisuuksista? Tule [Discord-kanavalle](https://discord.gg/NAb6H3UTjK) tai [Discussions-foorumille](https://github.com/bluewave-labs/checkmate/discussions).
- Haluatko ilmoituksen uusista julkaisuista? Käytä [Newreleases](https://newreleases.io/) -palvelua, joka on ilmainen julkaisujen seuraamiseen.
- Katso Checkmaten [asennus- ja käyttövideo](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Osallistuminen

Olemme [Alex](http://github.com/ajhollid) (tiiminvetäjä), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) ja [Karen](https://github.com/karenvicent) — autamme yksityishenkilöitä ja yrityksiä valvomaan infrastruktuuriaan ja palvelimiaan.

Olemme ylpeitä siitä, että rakennamme vahvoja suhteita osallistujiin kaikilla tasoilla. Vaikka projekti on nuori, Checkmate on jo saanut yli 7000 tähteä ja yli 90 osallistujaa eri puolilta maailmaa.

Repoamme tähdittävät työntekijät yhtiöistä **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes ja NEC** — älä siis epäröi, hyppää mukaan, osallistu ja opi kanssamme!

Näin voit osallistua:

0. Tähditä tämä repo :)
1. Tutustu [osallistujan oppaaseen](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Aloittelijoille suositellaan `good-first-issue`-tagia.
2. Lue tarkka [Checkmate-arkkitehtuurikuvaus](https://deepwiki.com/bluewave-labs/Checkmate), jos haluat syventyä rakenteeseen.
3. Avaa issue, jos uskot löytäneesi virheen.
4. Etsi `good-first-issue`-merkintöjä, jos olet uusi.
5. Tee pull request lisätäksesi ominaisuuksia, parannuksia tai virheenkorjauksia.
6. Tutustu `Checkmate`-koodikannan interaktiiviseen läpikäyntiin CodeCanvasissa [täällä](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Olemassa olevia datavirtasimulaatioita voi viimeistellä tai uusia luoda seuraamalla pikatutorialia [täällä](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
