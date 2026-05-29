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

<p align="center"><strong>オープンソースの稼働状況とインフラ監視アプリケーション</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


このリポジトリには、Checkmate のフロントエンドとバックエンドの両方が含まれています。Checkmate は、サーバーのハードウェア、稼働状況、応答時間、インシデントを見やすい可視化でリアルタイムに追跡する、オープンソースかつセルフホスト可能な監視ツールです。Checkmate はサーバーや Web サイトにアクセスできるか、正常に動作しているかを定期的にチェックし、監視対象サービスの可用性・ダウンタイム・応答時間に関するリアルタイムのアラートとレポートを提供します。

Checkmate には、リモートサーバーからデータを取得するエージェント [Capture](https://github.com/bluewave-labs/capture) も用意されています。Capture は Checkmate の動作に必須ではありませんが、サーバーの CPU、RAM、ディスク、温度の状態について追加情報を提供します。Capture は Linux、Windows、macOS、Raspberry Pi、その他 Go を実行できるあらゆるデバイスで動作します。

Checkmate は 1000 以上のアクティブな監視で負荷テストされており、目立った問題や性能のボトルネックは発生していません。

## 📚 目次

- [📦 デモ](#demo)
- [🔗 ユーザーガイド](#users-guide)
- [🛠️ インストール](#installation)
- [🚀 パフォーマンス](#performance)
- [💚 質問とアイデア](#questions--ideas)
- [🧩 機能](#features)
- [🏗️ スクリーンショット](#screenshots)
- [🏗️ 技術スタック](#tech-stack)
- [🔗 関連リンク](#a-few-links)
- [🤝 コントリビューション](#contributing)


<a id="demo"></a>
## デモ

[Checkmate](https://demo.checkmate.so/) の最新ビルドをそのまま試せます。

ユーザー名は demouser@demo.com、パスワードは Demouser1! です。（デモサーバーは時々更新しています。動作しない場合は Discussions チャンネルでお知らせください。）

<a id="users-guide"></a>
## ユーザーガイド

使用方法は [こちら](https://checkmate.so/docs) を参照してください。

## 前提条件
- [Docker](https://www.docker.com/) がインストールされていること
- [Git](https://git-scm.com/) がインストールされていること

<a id="installation"></a>
## インストール

インストール手順は [Checkmate ドキュメントポータル](https://checkmate.so/docs) を参照してください。

代わりに、[Coolify](https://coolify.io/)、[Elestio](https://elest.io/open-source/checkmate)、[K8s](./charts/helm/checkmate/INSTALLATION.md)、[Sive Host](https://sive.host)（南アフリカ）、[Cloudzy](https://cloudzy.com/marketplace/checkmate)、[Pikapods](https://www.pikapods.com/) を使って Checkmate インスタンスをすばやく立ち上げることもできます。サーバーインフラを監視したい場合は [Capture エージェント](https://github.com/bluewave-labs/capture) が必要です。Capture リポジトリにもインストール手順があります。

### カスタム CA の利用

プライベート認証局（Smallstep など）が発行した証明書で内部 HTTPS エンドポイントを監視する必要がある場合は、Docker 設定のオプションを記載した [カスタム CA 信頼ガイド](../custom-ca-trust.md) をご覧ください。

その他のドキュメントは [docs ディレクトリ](../) を参照してください。

<a id="performance"></a>
## パフォーマンス

広範な最適化により、Checkmate は非常に小さなメモリフットプリントで動作し、必要なメモリと CPU は最小限で済みます。以下は、毎分 323 台のサーバーを監視するサーバー上の Node.js インスタンスのメモリ使用量です：

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

同じサーバー上の MongoDB と Redis のメモリフットプリント（それぞれ 398MB と 15MB、同じサーバー数を監視）も以下の通りです:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## 質問とアイデア

質問・提案・コメントがあれば、いくつかの窓口があります：

- [Discord](https://discord.gg/NAb6H3UTjK)（推奨）
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions)（時々確認しています）

質問やアイデアの共有はお気軽にどうぞ — お声をお聞かせいただけると嬉しいです。

<a id="features"></a>
## 機能

- 完全にオープンソース、自身のサーバーや家庭用デバイス（例: Raspberry Pi 4 / 5）にデプロイ可能
- 複数の監視オプション: 稼働状況、Docker、Ping、SSL、ポート、ゲームサーバー
- ページスピード監視
- インフラ監視（メモリ、ディスク使用量、CPU 性能、ネットワークなど） — [Capture](https://github.com/bluewave-labs/capture) エージェントが必要
  - マウントポイントを選択した選択的なディスク監視
- インシデントを一目で確認
- 4 種類の美しいテーマを備えたステータスページ
- メール、Webhook、Discord、Slack、PagerDuty、Matrix、Microsoft Teams、Telegram、Pushover、Twilio (SMS) による通知
- メンテナンスのスケジューリング
- JSON クエリ監視
- 多言語対応: アラビア語、中国語（簡体字）、中国語（繁体字・台湾）、チェコ語、英語、フィンランド語、フランス語、ドイツ語、日本語、ポルトガル語（ブラジル）、ロシア語、スペイン語、タイ語、トルコ語、ウクライナ語、ベトナム語


## モニターのライフサイクル

1. モニターがチェックを実行する（HTTP / Ping / ポート / Capture エージェント経由のハードウェア）
2. 結果を保存する（成功・失敗 + 応答時間）
3. 直近の結果を、モニターに設定されたステータス変更のしきい値で評価する
4. しきい値を満たし、現在のステータスが直前と異なる場合、モニターの状態が変わる（例: `initializing`、`up`、`down`、`breached`）
5. 状態変化時に、現在のステータスに応じてインシデントを作成または解決する
6. 設定に基づいて通知をトリガーする

<a id="screenshots"></a>
## スクリーンショット

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
## 技術スタック

- [ReactJs](https://react.dev/)
- [MUI (React フレームワーク)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- その他多数のオープンソースコンポーネント！

<a id="a-few-links"></a>
## 関連リンク

- 応援いただける場合は、ぜひ ⭐ を付け、「watch」もクリックしてください。
- ロードマップや機能セットへの質問・提案がありますか？ [Discord チャンネル](https://discord.gg/NAb6H3UTjK) または [Discussions](https://github.com/bluewave-labs/checkmate/discussions) フォーラムをご覧ください。
- 新しいリリースの通知が欲しいですか？ リリース追跡用の無料サービス [Newreleases](https://newreleases.io/) をご利用ください。
- Checkmate の [インストールおよび利用方法の動画](https://www.youtube.com/watch?v=GfFOc0xHIwY) もご覧ください。

<a id="contributing"></a>
## コントリビューション

私たちは [Alex](http://github.com/ajhollid)（チームリード）、[Gorkem](http://github.com/gorkem-bwl/)、[Aryaman](https://github.com/Br0wnHammer)、[Mert](https://github.com/mertssmnoglu)、[Karen](https://github.com/karenvicent) で、個人や企業がインフラとサーバーを監視するお手伝いをしています。

あらゆるレベルのコントリビューターとの強いつながりを築くことを誇りにしています。若いプロジェクトでありながら、Checkmate はすでに 7000 を超えるスターと、世界中から 90 名以上のコントリビューターを集めています。

このリポジトリには **Google、Microsoft、Intel、Cisco、Tencent、Electronic Arts、ByteDance、JP Morgan Chase、Deloitte、Accenture、Foxconn、Broadcom、China Telecom、Barclays、Capgemini、Wipro、Cloudflare、Dassault Systèmes、NEC** の社員からスターが付いています — ぜひ気軽に参加し、貢献し、私たちと一緒に学びましょう！

コントリビュートの方法:

0. このリポジトリにスターを付ける :)
1. [コントリビューションガイド](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md) を読む。初参加の方には `good-first-issue` タグの確認をおすすめします。
2. アーキテクチャを深く知りたい場合は、[Checkmate の詳細構成](https://deepwiki.com/bluewave-labs/Checkmate) を読む。
3. バグを発見したと思ったら issue を開く。
4. はじめての方は `good-first-issue` を探す。
5. 新機能、品質改善、バグ修正のために pull request を作成する。
6. CodeCanvas 上の `Checkmate` コードベースのインタラクティブなウォークスルー（[こちら](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true)）を確認する。既存のデータフロー・シミュレーションを改善したり、新しいものを作成したりするには、[こちら](https://docs.code-canvas.com/updating-diagram) のクイックチュートリアルに従ってください。

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
