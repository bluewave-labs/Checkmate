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

> ⚠️ คำแปลนี้เป็นฉบับร่างที่สร้างโดยเครื่อง ยินดีรับการตรวจทานจากเจ้าของภาษาผ่าน pull request


![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>แอปพลิเคชันโอเพนซอร์สสำหรับตรวจสอบสถานะการทำงานและโครงสร้างพื้นฐาน</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


รีโพนี้ประกอบด้วยทั้งฟรอนต์เอนด์และแบ็กเอนด์ของ Checkmate ซึ่งเป็นเครื่องมือมอนิเตอร์โอเพนซอร์สและสามารถโฮสต์เองได้ ใช้ติดตามฮาร์ดแวร์ของเซิร์ฟเวอร์ เวลาการทำงาน เวลาในการตอบสนอง และเหตุการณ์ต่าง ๆ แบบเรียลไทม์พร้อมการแสดงผลที่สวยงาม Checkmate จะตรวจสอบเป็นระยะ ๆ ว่าเซิร์ฟเวอร์/เว็บไซต์ใช้งานได้และทำงานได้อย่างเหมาะสมหรือไม่ พร้อมส่งการแจ้งเตือนและรายงานแบบเรียลไทม์เกี่ยวกับความพร้อมใช้งาน ช่วงเวลาที่ระบบไม่พร้อมใช้งาน และเวลาในการตอบสนองของบริการที่ตรวจสอบ

Checkmate ยังมีเอเจนต์ชื่อ [Capture](https://github.com/bluewave-labs/capture) สำหรับดึงข้อมูลจากเซิร์ฟเวอร์ระยะไกล Capture ไม่จำเป็นต้องใช้เพื่อรัน Checkmate แต่จะให้ข้อมูลเพิ่มเติมเกี่ยวกับ CPU, RAM, ดิสก์ และอุณหภูมิของเซิร์ฟเวอร์ Capture ทำงานได้บน Linux, Windows, Mac, Raspberry Pi หรือทุกอุปกรณ์ที่รัน Go ได้

Checkmate ผ่านการทดสอบโหลดสำหรับมอนิเตอร์ที่ทำงานอยู่กว่า 1000 รายการโดยไม่พบปัญหาหรือคอขวดด้านประสิทธิภาพที่สำคัญ

## 📚 สารบัญ

- [📦 เดโม](#demo)
- [🔗 คู่มือผู้ใช้](#users-guide)
- [🛠️ การติดตั้ง](#installation)
- [🚀 ประสิทธิภาพ](#performance)
- [💚 คำถามและไอเดีย](#questions--ideas)
- [🧩 ฟีเจอร์](#features)
- [🏗️ ภาพหน้าจอ](#screenshots)
- [🏗️ Tech stack](#tech-stack)
- [🔗 ลิงก์เพิ่มเติม](#a-few-links)
- [🤝 การมีส่วนร่วม](#contributing)


<a id="demo"></a>
## เดโม

คุณสามารถดูบิลด์ล่าสุดของ [Checkmate](https://demo.checkmate.so/) ที่ใช้งานจริง

ชื่อผู้ใช้คือ demouser@demo.com และรหัสผ่านคือ Demouser1! (โปรดทราบว่าเราอัปเดตเซิร์ฟเวอร์เดโมเป็นระยะ ๆ หากไม่ทำงาน โปรดแจ้งเราที่ช่อง Discussions)

<a id="users-guide"></a>
## คู่มือผู้ใช้

วิธีใช้งานสามารถดูได้ [ที่นี่](https://checkmate.so/docs)

## ข้อกำหนดเบื้องต้น
- ติดตั้ง [Docker](https://www.docker.com/)
- ติดตั้ง [Git](https://git-scm.com/)

<a id="installation"></a>
## การติดตั้ง

ดูวิธีการติดตั้งใน [พอร์ทัลเอกสารของ Checkmate](https://checkmate.so/docs)

อีกทางเลือกหนึ่ง คุณสามารถใช้ [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](../../charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (แอฟริกาใต้), [Cloudzy](https://cloudzy.com/marketplace/checkmate) หรือ [Pikapods](https://www.pikapods.com/) เพื่อเปิดอินสแตนซ์ Checkmate ได้อย่างรวดเร็ว หากต้องการมอนิเตอร์โครงสร้างพื้นฐานเซิร์ฟเวอร์ คุณจะต้องใช้ [เอเจนต์ Capture](https://github.com/bluewave-labs/capture) รีโพ Capture ยังมีวิธีการติดตั้งด้วย

### การใช้ Custom CA

หากคุณต้องการมอนิเตอร์ HTTPS เอนด์พอยต์ภายในที่ใช้ใบรับรองจาก CA ส่วนตัว (เช่น Smallstep) โปรดดู [คู่มือการเชื่อถือ CA แบบกำหนดเอง](../custom-ca-trust.md) สำหรับตัวเลือกการตั้งค่า Docker

สำหรับเอกสารเพิ่มเติม ดูที่ [โฟลเดอร์ docs](../)

<a id="performance"></a>
## ประสิทธิภาพ

ด้วยการปรับแต่งอย่างละเอียด Checkmate ใช้หน่วยความจำน้อยอย่างมาก และต้องการ RAM กับ CPU น้อยที่สุด ด้านล่างเป็นการใช้หน่วยความจำของอินสแตนซ์ Node.js บนเซิร์ฟเวอร์ที่มอนิเตอร์เซิร์ฟเวอร์ 323 เครื่องทุกนาที:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

คุณยังสามารถดูการใช้หน่วยความจำของ MongoDB และ Redis บนเซิร์ฟเวอร์เดียวกัน (398MB และ 15MB) สำหรับจำนวนเซิร์ฟเวอร์เท่าเดิม:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## คำถามและไอเดีย

หากมีคำถาม ข้อเสนอแนะ หรือความคิดเห็น คุณมีหลายทางเลือก:

- [ช่อง Discord](https://discord.gg/NAb6H3UTjK) (แนะนำ)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (เราเข้ามาดูเป็นระยะ)

อย่าลังเลที่จะถามหรือแชร์ไอเดีย — เรายินดีรับฟังเสมอ!

<a id="features"></a>
## ฟีเจอร์

- โอเพนซอร์สอย่างสมบูรณ์ สามารถดีพลอยบนเซิร์ฟเวอร์หรืออุปกรณ์ภายในบ้าน (เช่น Raspberry Pi 4 หรือ 5)
- ตัวเลือกการมอนิเตอร์หลายแบบ: สถานะการทำงาน, Docker, Ping, SSL, พอร์ต, เซิร์ฟเวอร์เกม
- มอนิเตอร์ความเร็วของหน้าเว็บ
- มอนิเตอร์โครงสร้างพื้นฐาน (หน่วยความจำ การใช้ดิสก์ ประสิทธิภาพ CPU เครือข่าย ฯลฯ) — ต้องใช้เอเจนต์ [Capture](https://github.com/bluewave-labs/capture)
  - มอนิเตอร์ดิสก์แบบเลือกได้ด้วยการเลือก mount point
- ดูเหตุการณ์ได้ในที่เดียว
- หน้าสถานะที่มี 4 ธีมสวยงาม
- การแจ้งเตือนผ่านอีเมล Webhook, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- การบำรุงรักษาตามกำหนด
- มอนิเตอร์ด้วย JSON query
- รองรับหลายภาษา: อาหรับ, จีน (ตัวย่อ), จีน (ตัวเต็ม, ไต้หวัน), เช็ก, อังกฤษ, ฟินแลนด์, ฝรั่งเศส, เยอรมัน, ญี่ปุ่น, โปรตุเกส (บราซิล), รัสเซีย, สเปน, ไทย, ตุรกี, ยูเครน และเวียดนาม


## วงจรชีวิตของมอนิเตอร์

1. มอนิเตอร์ทำการตรวจสอบ (HTTP / Ping / พอร์ต / ฮาร์ดแวร์ผ่านเอเจนต์ Capture)
2. ผลลัพธ์ถูกบันทึก (สำเร็จ/ล้มเหลว + เวลาในการตอบสนอง)
3. ผลลัพธ์ล่าสุดจะถูกประเมินเทียบกับเกณฑ์การเปลี่ยนสถานะที่ตั้งค่าไว้
4. ถ้าเกณฑ์ถูกตอบสนอง และสถานะปัจจุบันไม่เท่ากับสถานะก่อนหน้า สถานะของมอนิเตอร์จะเปลี่ยน (เช่น `initializing`, `up`, `down`, `breached`)
5. เมื่อสถานะเปลี่ยน เหตุการณ์จะถูกสร้างหรือถูกแก้ไขตามสถานะปัจจุบัน
6. การแจ้งเตือนจะถูกทริกเกอร์ตามการตั้งค่า

<a id="screenshots"></a>
## ภาพหน้าจอ

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
- [MUI (React framework)](https://mui.com/)
- [Node.js](https://nodejs.org/en)
- [MongoDB](https://mongodb.com)
- [Recharts](https://recharts.org)
- และส่วนประกอบโอเพนซอร์สอื่นอีกมาก!

<a id="a-few-links"></a>
## ลิงก์เพิ่มเติม

- หากต้องการสนับสนุนเรา โปรดให้ ⭐ และคลิก "watch"
- มีคำถามหรือข้อเสนอแนะเกี่ยวกับโรดแมป/ฟีเจอร์? เยี่ยมชม [ช่อง Discord](https://discord.gg/NAb6H3UTjK) หรือฟอรัม [Discussions](https://github.com/bluewave-labs/checkmate/discussions) ของเรา
- ต้องการการแจ้งเตือนเมื่อมีรีลีสใหม่? ใช้ [Newreleases](https://newreleases.io/) บริการฟรีสำหรับติดตามการรีลีส
- ดู [วิดีโอการติดตั้งและใช้งาน Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## การมีส่วนร่วม

พวกเราคือ [Alex](http://github.com/ajhollid) (หัวหน้าทีม), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) และ [Karen](https://github.com/karenvicent) ที่ช่วยให้บุคคลและธุรกิจสามารถมอนิเตอร์โครงสร้างพื้นฐานและเซิร์ฟเวอร์ได้

เราภูมิใจกับการสร้างความสัมพันธ์ที่แข็งแกร่งกับผู้ร่วมพัฒนาในทุกระดับ แม้จะเป็นโครงการที่ยังใหม่ แต่ Checkmate ได้รับมากกว่า 7000 ดาว และมีผู้ร่วมพัฒนามากกว่า 90 คนจากทั่วโลก

รีโพของเราได้รับดาวจากพนักงานของ **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes และ NEC** — เพราะฉะนั้นอย่าลังเล ร่วมพัฒนา เรียนรู้ และเติบโตไปกับเรา!

วิธีที่คุณสามารถร่วมพัฒนา:

0. ให้ดาวกับรีโพนี้ :)
1. อ่าน [คู่มือผู้ร่วมพัฒนา](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md) ผู้เริ่มต้นแนะนำให้ดูแท็ก `good-first-issue`
2. อ่านโครงสร้างเชิงลึกของ [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) หากต้องการเจาะลึกสถาปัตยกรรม
3. เปิด issue หากคุณคิดว่าพบบั๊ก
4. มองหาประเด็นที่ติดแท็ก `good-first-issue` หากเป็นมือใหม่
5. ส่ง pull request เพื่อเพิ่มฟีเจอร์ ปรับปรุงการใช้งาน หรือแก้บั๊ก
6. ดู interactive walkthrough ของโค้ดเบส `Checkmate` บน CodeCanvas [ที่นี่](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true) เพื่อปรับปรุงการจำลอง dataflow ที่มีอยู่หรือสร้างใหม่ ทำตามบทเรียนสั้น [ที่นี่](https://docs.code-canvas.com/updating-diagram)

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
