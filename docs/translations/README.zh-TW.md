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

<p align="center"><strong>開源的可用性與基礎架構監控應用程式</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


本儲存庫同時包含 Checkmate 的前端與後端程式碼。Checkmate 是一款開源、可自我託管的監控工具,透過美觀的視覺化即時追蹤伺服器硬體、運作時間、回應時間以及事件。Checkmate 會定期檢查伺服器或網站是否可存取且運作正常,並針對被監控服務的可用性、停機時間和回應時間提供即時警報與報告。

Checkmate 還提供一個名為 [Capture](https://github.com/bluewave-labs/capture) 的代理程式,用以從遠端伺服器擷取資料。Capture 並非執行 Checkmate 的必要元件,但能提供伺服器 CPU、記憶體、磁碟與溫度的額外資訊。Capture 可在 Linux、Windows、Mac、Raspberry Pi 或任何能執行 Go 的裝置上運行。

Checkmate 已在 1000+ 個活躍監控項目下進行過壓力測試,未發生任何明顯問題或效能瓶頸。

## 📚 目錄

- [📦 展示](#demo)
- [🔗 使用者指南](#users-guide)
- [🛠️ 安裝](#installation)
- [🚀 效能](#performance)
- [💚 問題與想法](#questions--ideas)
- [🧩 功能](#features)
- [🏗️ 螢幕截圖](#screenshots)
- [🏗️ 技術堆疊](#tech-stack)
- [🔗 一些連結](#a-few-links)
- [🤝 參與貢獻](#contributing)


<a id="demo"></a>
## 展示

你可以體驗最新版本的 [Checkmate](https://demo.checkmate.so/)。

使用者名稱為 demouser@demo.com,密碼為 Demouser1!(我們會不定期更新示範伺服器,若無法使用,請於 Discussions 頻道告知我們)。

<a id="users-guide"></a>
## 使用者指南

使用說明請見[這裡](https://checkmate.so/docs)。

## 先決條件
- 已安裝 [Docker](https://www.docker.com/)
- 已安裝 [Git](https://git-scm.com/)

<a id="installation"></a>
## 安裝

安裝說明請參閱 [Checkmate 文件入口](https://checkmate.so/docs)。

你也可以使用 [Coolify](https://coolify.io/)、[Elestio](https://elest.io/open-source/checkmate)、[K8s](./charts/helm/checkmate/INSTALLATION.md)、[Sive Host](https://sive.host)(南非)、[Cloudzy](https://cloudzy.com/marketplace/checkmate) 或 [Pikapods](https://www.pikapods.com/) 來快速啟動一個 Checkmate 實例。若要監控伺服器基礎架構,需要 [Capture 代理程式](https://github.com/bluewave-labs/capture),Capture 儲存庫中也提供了安裝說明。

### 使用自訂 CA

如果你需要使用私有 CA(例如 Smallstep)發行的憑證來監控內部 HTTPS 端點,請參考我們的 [自訂 CA 信任指南](../custom-ca-trust.md),其中介紹了 Docker 的設定選項。

更多文件請參閱 [docs 目錄](../)。

<a id="performance"></a>
## 效能

由於進行了大量最佳化,Checkmate 的記憶體佔用極小,所需記憶體與 CPU 資源也非常少。以下是每分鐘監控 323 台伺服器的 Node.js 實例的記憶體使用情況:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

同一台伺服器、相同監控數量下,MongoDB 與 Redis 的記憶體佔用(分別為 398MB 與 15MB):

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## 問題與想法

若有任何問題、建議或意見,歡迎透過以下方式聯繫我們:

- [Discord 頻道](https://discord.gg/NAb6H3UTjK)(建議使用)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions)(我們會不定期查看)

歡迎隨時提問或分享你的想法 — 我們很期待聽到你的聲音!

<a id="features"></a>
## 功能

- 完全開源,可部署到自己的伺服器或家用裝置(例如 Raspberry Pi 4 / 5)
- 多種監控選項:可用性、Docker、Ping、SSL、連接埠、遊戲伺服器
- 頁面速度監控
- 基礎架構監控(記憶體、磁碟使用量、CPU 效能、網路等) — 需要 [Capture](https://github.com/bluewave-labs/capture) 代理程式
  - 透過掛載點選擇進行的選擇性磁碟監控
- 一目了然的事件檢視
- 提供 4 套精美主題的狀態頁
- 透過電子郵件、Webhook、Discord、Slack、PagerDuty、Matrix、Microsoft Teams、Telegram、Pushover、Twilio (SMS) 傳送通知
- 排程維護
- JSON 查詢監控
- 多語言支援:阿拉伯文、簡體中文、繁體中文(台灣)、捷克文、英文、芬蘭文、法文、德文、日文、葡萄牙文(巴西)、俄文、西班牙文、泰文、土耳其文、烏克蘭文與越南文


## 監控項目生命週期

1. 監控項目執行一次檢查(HTTP / Ping / 連接埠 / 透過 Capture 代理的硬體檢查)
2. 結果會被儲存(成功/失敗 + 回應時間)
3. 近期的檢查結果會依該監控項目所設定的狀態變更門檻進行評估
4. 當達到狀態變更門檻且目前狀態與上一次狀態不同時,監控項目的狀態會改變(例如 `initializing`、`up`、`down`、`breached`)
5. 狀態變更時,會根據監控項目目前的狀態建立或解決一個事件
6. 通知會依照設定觸發

<a id="screenshots"></a>
## 螢幕截圖

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
## 技術堆疊

- [ReactJs](https://react.dev/)
- [MUI (React 框架)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- 以及許多其他開源元件!

<a id="a-few-links"></a>
## 一些連結

- 如果你想支持我們,請考慮給專案點 ⭐ 並點選 "watch"。
- 對藍圖或功能集有問題或建議嗎?歡迎加入我們的 [Discord 頻道](https://discord.gg/NAb6H3UTjK) 或 [Discussions](https://github.com/bluewave-labs/checkmate/discussions) 討論區。
- 想在新版本釋出時收到通知?可以使用免費的版本追蹤服務 [Newreleases](https://newreleases.io/)。
- 觀看 Checkmate 的 [安裝與使用影片](https://www.youtube.com/watch?v=GfFOc0xHIwY)。

<a id="contributing"></a>
## 參與貢獻

我們是 [Alex](http://github.com/ajhollid)(團隊負責人)、[Gorkem](http://github.com/gorkem-bwl/)、[Aryaman](https://github.com/Br0wnHammer)、[Mert](https://github.com/mertssmnoglu) 和 [Karen](https://github.com/karenvicent),致力於協助個人與企業監控其基礎架構與伺服器。

我們以與各層級貢獻者建立穩固關係為榮。儘管 Checkmate 還是一個年輕的專案,但已獲得超過 7000 顆星,並吸引了來自全球的 90+ 位貢獻者。

我們的儲存庫已被來自 **Google、Microsoft、Intel、Cisco、Tencent、Electronic Arts、ByteDance、JP Morgan Chase、Deloitte、Accenture、Foxconn、Broadcom、China Telecom、Barclays、Capgemini、Wipro、Cloudflare、Dassault Systèmes 與 NEC** 的員工點亮 — 所以請不要猶豫,加入我們,一起貢獻、一起學習吧!

如何貢獻:

0. 給本儲存庫點亮 ⭐ :)
1. 閱讀 [貢獻者指南](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md)。新手建議先查看 `good-first-issue` 標籤。
2. 如果想深入了解架構,請閱讀 [Checkmate 的詳細結構介紹](https://deepwiki.com/bluewave-labs/Checkmate)。
3. 若你認為遇到了 bug,請開啟一個 issue。
4. 如果你是新手,建議從 `good-first-issue` 開始。
5. 提交 pull request 來新增功能、改善體驗或修正 bug。
6. 透過 CodeCanvas 上的 `Checkmate` 程式碼互動導覽(請點 [這裡](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true))。若要精修現有的資料流模擬或建立新的模擬,請依 [此處](https://docs.code-canvas.com/updating-diagram) 的快速教學操作。

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
