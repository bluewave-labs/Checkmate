<p align=center> <a href="https://trendshift.io/repositories/12443" target="_blank"><img src="https://trendshift.io/api/badge/repositories/12443" alt="bluewave-labs%2Fcheckmate | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a></p>
  
![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/9901/badge)](https://www.bestpractices.dev/projects/9901)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>An open source uptime and infrastructure monitoring application</strong></p>

![dashboard](https://github.com/user-attachments/assets/252d6047-522b-4576-8f14-233510e464b8)

This repository contains both the frontend and the backend of Checkmate, an open-source, self-hosted monitoring tool for tracking server hardware, uptime, response times, and incidents in real-time with beautiful visualizations. Checkmate regularly checks whether a server/website is accessible and performs optimally, providing real-time alerts and reports on the monitored services' availability, downtime, and response time.

Checkmate also has an agent, called [Capture](https://github.com/bluewave-labs/capture), to retrieve data from remote servers. While Capture is not required to run Checkmate, it provides additional insights about your servers' CPU, RAM, disk, and temperature status.

Checkmate has been stress-tested with 1000+ active monitors without any particular issues or performance bottlenecks.

We **love** what we are building here, and we continuously learn a few things about Reactjs, Nodejs, MongoDB, and Docker while building Checkmate.

## 📦 Demo

You can see the latest build of [Checkmate](https://checkmate-demo.bluewavelabs.ca/) in action. The username is uptimedemo@demo.com and the password is Demouser1! (just a note that we update the demo server from time to time, so if it doesn't work for you, please ping us on the Discussions channel).

## 🔗 User's guide

Usage instructions can be found [here](https://docs.checkmate.so/). It's still WIP and some of the information there might be outdated as we continuously add features weekly. Rest assured, we are doing our best! :)

## 🛠️ Installation

See installation instructions in [Checkmate documentation portal](https://docs.checkmate.so/quickstart). Alternatively, you can also use [Coolify](https://coolify.io/) or [Elestio](https://elest.io/open-source/checkmate) for a one-click Docker deployment. If you would like to monitor your server infrastructure, you'll need [Capture agent](https://github.com/bluewave-labs/capture). Capture repository also contains the installation instructions.

## 🏁 Translations

If you would like to use Checkmate in your language, please [go to this page](https://poeditor.com/join/project/lRUoGZFCsJ) and register for the language you would like to translate Checkmate to. 

## 🚀 Performance

Thanks to extensive optimizations, Checkmate operates with an exceptionally small memory footprint, requiring minimal memory and CPU resources. Here’s the memory usage of a Node.js instance running on a server that monitors 323 servers every minute:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

You can see the memory footprint of MongoDB and Redis on the same server (398Mb and 15Mb) for the same amount of servers:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

## 💚 Questions & Ideas

If you have any questions, suggestions or comments, please use our [Discord channel](https://discord.gg/NAb6H3UTjK). We've also launched our [Discussions](https://github.com/bluewave-labs/bluewave-uptime/discussions) page! Feel free to ask questions or share your ideas—we'd love to hear from you!

## 🧩 Features

- Completely open source, deployable on your servers
- Website monitoring
- Page speed monitoring
- Infrastructure monitoring (memory, disk usage, CPU performance etc) - requires [Capture](https://github.com/bluewave-labs/capture)
- Docker monitoring
- Ping monitoring
- SSL monitoring
- Port monitoring
- Incidents at a glance
- E-mail notifications
- Scheduled maintenance

**Short term roadmap:**

- Status pages (**in progress**) https://github.com/bluewave-labs/Checkmate/issues/1131
- Translations (i18n) (**in progress**)
- Better notification options (Webhooks, Discord, Telegram, Slack) (**in progress**) https://github.com/bluewave-labs/Checkmate/issues/1545
- JSON query monitoring  (**in progress**) https://github.com/bluewave-labs/Checkmate/issues/1573
- Tagging/grouping monitors https://github.com/bluewave-labs/Checkmate/issues/1546
- More configuration options
- DNS monitoring

## 🏗️ Screenshots

<p>
<img width="2714" alt="server" src="https://github.com/user-attachments/assets/f7cb272a-69a6-48c5-93b0-249ecf20ecc6" />
</p>
<p>
<img width="2714" alt="uptime" src="https://github.com/user-attachments/assets/98ddc6c0-3384-47fd-96ce-7e53e6b688ac" />
</p>
<p>
<img width="2714" alt="page speed" src="https://github.com/user-attachments/assets/b5589f79-da30-4239-9846-1f8bb2637ff9" />
</p>

## 🏗️ Tech stack

- [ReactJs](https://react.dev/)
- [MUI (React framework)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- Lots of other open source components!

## A few links

- If you would like to support us, please consider giving it a ⭐ and click on "watch".
- Have a question or suggestion for the roadmap/featureset? Check our [Discord channel](https://discord.gg/NAb6H3UTjK) or [Discussions](https://github.com/bluewave-labs/checkmate/discussions) forum.
- Need a ping when there's a new release? Use [Newreleases](https://newreleases.io/), a free service to track releases.
- Watch a Checkmate [installation and usage video](https://www.youtube.com/watch?v=GfFOc0xHIwY)

## 🤝 Contributing

We are [Alex](http://github.com/ajhollid) (team lead), [Vishnu](http://github.com/vishnusn77), [Mohadeseh](http://github.com/mohicody), [Gorkem](http://github.com/gorkem-bwl/), [Owaise](http://github.com/Owaiseimdad), [Aryaman](https://github.com/Br0wnHammer) and [Mert](https://github/com/mertssmnoglu) helping individuals and businesses monitor their infra and servers.

We pride ourselves on building strong connections with contributors at every level. Despite being a young project, Checkmate has already earned 5000+ stars and attracted 60 contributors from around the globe.

Our repo is starred by employees from **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes and NEC**, so don’t hold back — jump in, contribute and learn with us!

Here's how you can contribute:

0. Star this repo :)
1. Check [Contributor's guideline](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). First timers are encouraged to check `good-first-issue` tag.
2. Check [project structure](https://docs.checkmate.so/developers-guide/general-project-structure) and [high level overview](https://bluewavelabs.gitbook.io/checkmate/developers-guide/high-level-overview).
3. Read a detailed structure of [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) if you would like to deep dive into the architecture.
4. Open an issue if you believe you've encountered a bug.
5. Check for good-first-issue's if you are a newcomer.
6. Make a pull request to add new features/make quality-of-life improvements/fix bugs.

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

## 💰 Our sponsors

Thanks to [Gitbook](https://gitbook.io/) for giving us a free tier for their documentation platform, and [Poeditor](https://poeditor.com/) providing us a free account to use their i18n services. If you would like to sponsor Checkmate, please send an email to hello@bluewavelabs.ca

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/bluewave-uptime&Date)

Also check other developer and contributor-friendly projects of BlueWave:

- [VerifyWise](https://github.com/bluewave-labs/verifywise), the first open source AI governance platform.
- [DataRoom](https://github.com/bluewave-labs/bluewave-dataroom), an secure file sharing application, aka dataroom.
- [Guidefox](https://github.com/bluewave-labs/guidefox), an application that helps new users learn how to use your product via hints, tours, popups and banners.
