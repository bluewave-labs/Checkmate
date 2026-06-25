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

<p align="center"><strong>开源的可用性与基础设施监控应用</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


本仓库同时包含 Checkmate 的前端和后端代码。Checkmate 是一款开源、可自托管的监控工具，通过精美的可视化效果实时追踪服务器硬件、可用性、响应时间以及事件。Checkmate 会定期检查服务器或网站是否可访问、运行是否正常，并针对被监控服务的可用性、停机时间和响应时间提供实时告警与报告。

Checkmate 还提供了一个名为 [Capture](https://github.com/bluewave-labs/capture) 的代理，用于从远程服务器拉取数据。Capture 并不是运行 Checkmate 所必需的，但它能提供服务器 CPU、内存、磁盘和温度的额外信息。Capture 可在 Linux、Windows、Mac、Raspberry Pi 或任何能运行 Go 的设备上运行。

Checkmate 已经在 1000+ 个活跃监控项的环境下完成压力测试，未出现任何明显问题或性能瓶颈。

## 📚 目录

- [📦 演示](#demo)
- [🔗 用户指南](#users-guide)
- [🛠️ 安装](#installation)
- [🚀 性能](#performance)
- [💚 问题与想法](#questions--ideas)
- [🧩 功能](#features)
- [🏗️ 截图](#screenshots)
- [🏗️ 技术栈](#tech-stack)
- [🔗 一些链接](#a-few-links)
- [🤝 参与贡献](#contributing)


<a id="demo"></a>
## 演示

你可以体验最新版本的 [Checkmate](https://demo.checkmate.so/)。

用户名是 demouser@demo.com，密码是 Demouser1!（请注意，我们会不定期更新演示服务器，如果遇到问题，请在 Discussions 频道告诉我们）。

<a id="users-guide"></a>
## 用户指南

使用说明请参见[这里](https://checkmate.so/docs)。

## 前置要求
- 已安装 [Docker](https://www.docker.com/)
- 已安装 [Git](https://git-scm.com/)

<a id="installation"></a>
## 安装

请参阅 [Checkmate 文档门户](https://checkmate.so/docs)中的安装说明。

你也可以使用 [Coolify](https://coolify.io/)、[Elestio](https://elest.io/open-source/checkmate)、[K8s](./charts/helm/checkmate/INSTALLATION.md)、[Sive Host](https://sive.host)（南非）、[Cloudzy](https://cloudzy.com/marketplace/checkmate) 或 [Pikapods](https://www.pikapods.com/) 快速启动一个 Checkmate 实例。如果想监控服务器基础设施，你需要 [Capture 代理](https://github.com/bluewave-labs/capture)，Capture 仓库中也提供了安装说明。

### 使用自定义 CA

如果你需要使用私有 CA（例如 Smallstep）签发的证书来监控内部 HTTPS 端点，请查看我们的 [自定义 CA 信任指南](../custom-ca-trust.md)，其中介绍了 Docker 的配置选项。

更多文档请参见 [docs 目录](../)。

<a id="performance"></a>
## 性能

得益于大量优化，Checkmate 在运行时占用的内存非常少，对内存和 CPU 资源的需求极低。下方是一个每分钟监控 323 台服务器的 Node.js 实例的内存使用情况:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

同一台服务器、相同监控数量下的 MongoDB 与 Redis 的内存占用（分别为 398MB 与 15MB）:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## 问题与想法

如果你有任何问题、建议或意见，欢迎通过以下方式联系我们:

- [Discord 频道](https://discord.gg/NAb6H3UTjK)（推荐）
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions)（我们会不定期查看）

欢迎提问或分享你的想法 — 期待听到你的声音！

<a id="features"></a>
## 功能

- 完全开源，可部署到自己的服务器或家用设备（如 Raspberry Pi 4/5）
- 多种监控选项: 可用性、Docker、Ping、SSL、端口、游戏服务器
- 页面速度监控
- 基础设施监控（内存、磁盘使用情况、CPU 性能、网络等） — 需要 [Capture](https://github.com/bluewave-labs/capture) 代理
  - 通过挂载点选择实现的选择性磁盘监控
- 一目了然的事件视图
- 提供 4 套精美主题的状态页
- 通过邮件、Webhook、Discord、Slack、PagerDuty、Matrix、Microsoft Teams、Telegram、Pushover、Twilio (SMS) 发送通知
- 计划维护
- JSON 查询监控
- 多语言支持: 阿拉伯语、简体中文、繁体中文（台湾）、捷克语、英语、芬兰语、法语、德语、日语、葡萄牙语（巴西）、俄语、西班牙语、泰语、土耳其语、乌克兰语和越南语


## 监控生命周期

1. 监控项执行一次检查（HTTP / Ping / 端口 / 通过 Capture 代理的硬件检查）
2. 结果被保存（成功/失败 + 响应时间）
3. 近期的检查结果会根据该监控项配置的状态变更阈值进行评估
4. 当达到状态变更阈值且当前状态与上一状态不同时，监控项状态发生变化（例如 `initializing`、`up`、`down`、`breached`）
5. 状态发生变化时，会根据监控项当前状态创建或解决一个事件
6. 根据配置触发通知

<a id="screenshots"></a>
## 截图

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
## 技术栈

- [ReactJs](https://react.dev/)
- [MUI (React 框架)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- 以及大量其他开源组件！

<a id="a-few-links"></a>
## 一些链接

- 如果你想支持我们，请考虑给项目点 ⭐ 并点击 “watch”。
- 对路线图/功能集有问题或建议？欢迎加入我们的 [Discord 频道](https://discord.gg/NAb6H3UTjK) 或 [Discussions](https://github.com/bluewave-labs/checkmate/discussions) 论坛。
- 想在新版本发布时收到通知？可以使用免费的版本追踪服务 [Newreleases](https://newreleases.io/)。
- 观看 Checkmate 的 [安装与使用视频](https://www.youtube.com/watch?v=GfFOc0xHIwY)。

<a id="contributing"></a>
## 参与贡献

我们是 [Alex](http://github.com/ajhollid)（团队负责人）、[Gorkem](http://github.com/gorkem-bwl/)、[Aryaman](https://github.com/Br0wnHammer)、[Mert](https://github.com/mertssmnoglu) 和 [Karen](https://github.com/karenvicent)，致力于帮助个人和企业监控他们的基础设施与服务器。

我们以与各个层次的贡献者建立稳固关系为荣。尽管 Checkmate 还是一个年轻的项目，但它已经获得超过 7000 颗星，并吸引了来自全球的 90+ 位贡献者。

我们的仓库已经被来自 **Google、Microsoft、Intel、Cisco、Tencent、Electronic Arts、ByteDance、JP Morgan Chase、Deloitte、Accenture、Foxconn、Broadcom、China Telecom、Barclays、Capgemini、Wipro、Cloudflare、Dassault Systèmes 和 NEC** 的员工点亮 — 所以不要犹豫，欢迎加入我们，一起贡献和成长！

参与贡献的方式:

0. 给本仓库点亮 ⭐ :)
1. 阅读 [贡献者指南](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md)。新手建议先查看 `good-first-issue` 标签。
2. 如果想深入了解架构，请阅读 [Checkmate 的详细结构介绍](https://deepwiki.com/bluewave-labs/Checkmate)。
3. 如果你认为遇到了 bug，请提交一个 issue。
4. 如果你是新手，建议从 `good-first-issue` 入手。
5. 提交 pull request 来添加新功能、改进体验或修复 bug。
6. 通过 CodeCanvas 上的 `Checkmate` 代码交互式演示了解项目（[点这里](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true)）。如要完善已有数据流仿真或创建新的仿真，请参考 [这里](https://docs.code-canvas.com/updating-diagram) 的快速教程。

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
