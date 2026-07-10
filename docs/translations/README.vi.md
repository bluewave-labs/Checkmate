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

> ⚠️ Bản dịch này là bản nháp được dịch bằng máy. Rất hoan nghênh sự đóng góp chỉnh sửa từ người bản ngữ qua pull request.


![](https://img.shields.io/github/license/bluewave-labs/checkmate)
![](https://img.shields.io/github/repo-size/bluewave-labs/checkmate)
![](https://img.shields.io/github/commit-activity/m/bluewave-labs/checkmate)
![](https://img.shields.io/github/last-commit/bluewave-labs/checkmate)
![](https://img.shields.io/github/languages/top/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues/bluewave-labs/checkmate)
![](https://img.shields.io/github/issues-pr/bluewave-labs/checkmate)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bluewave-labs/checkmate)

<h1 align="center"><a href="https://bluewavelabs.ca" target="_blank">Checkmate</a></h1>

<p align="center"><strong>Ứng dụng mã nguồn mở giám sát tình trạng hoạt động và hạ tầng</strong></p>

[![Run on PikaPods](https://www.pikapods.com/static/run-button.svg)](https://www.pikapods.com/pods?run=checkmate)

<img width="1703" height="1041" alt="image" src="https://github.com/user-attachments/assets/0f4dcf38-9b42-4b84-8633-ff34778df1a8" />

<br>


Kho mã nguồn này chứa cả frontend và backend của Checkmate — một công cụ giám sát mã nguồn mở, tự lưu trữ, theo dõi phần cứng máy chủ, thời gian hoạt động, thời gian phản hồi và sự cố theo thời gian thực với các biểu đồ trực quan đẹp mắt. Checkmate định kỳ kiểm tra xem một máy chủ/trang web có khả truy cập và hoạt động tối ưu hay không, đồng thời cung cấp cảnh báo và báo cáo theo thời gian thực về độ khả dụng, thời gian gián đoạn và thời gian phản hồi của các dịch vụ được giám sát.

Checkmate cũng có một agent tên là [Capture](https://github.com/bluewave-labs/capture) dùng để lấy dữ liệu từ các máy chủ từ xa. Capture không bắt buộc để chạy Checkmate, nhưng cung cấp thêm thông tin về CPU, RAM, ổ đĩa và nhiệt độ của máy chủ. Capture có thể chạy trên Linux, Windows, Mac, Raspberry Pi hoặc bất kỳ thiết bị nào có thể chạy Go.

Checkmate đã được kiểm thử với hơn 1000 monitor đang hoạt động mà không gặp bất kỳ vấn đề nào hay điểm nghẽn hiệu năng đáng kể.

## 📚 Mục lục

- [📦 Demo](#demo)
- [🔗 Hướng dẫn sử dụng](#users-guide)
- [🛠️ Cài đặt](#installation)
- [🚀 Hiệu năng](#performance)
- [💚 Câu hỏi & ý tưởng](#questions--ideas)
- [🧩 Tính năng](#features)
- [🏗️ Ảnh chụp màn hình](#screenshots)
- [🏗️ Tech stack](#tech-stack)
- [🔗 Một vài liên kết](#a-few-links)
- [🤝 Đóng góp](#contributing)


<a id="demo"></a>
## Demo

Bạn có thể xem bản dựng mới nhất của [Checkmate](https://demo.checkmate.so/) đang chạy.

Tên đăng nhập là demouser@demo.com và mật khẩu là Demouser1! (lưu ý: chúng tôi cập nhật máy chủ demo theo thời gian; nếu không hoạt động, hãy báo cho chúng tôi qua kênh Discussions).

<a id="users-guide"></a>
## Hướng dẫn sử dụng

Có thể tìm thấy hướng dẫn sử dụng [tại đây](https://checkmate.so/docs).

## Yêu cầu trước
- Đã cài [Docker](https://www.docker.com/)
- Đã cài [Git](https://git-scm.com/)

<a id="installation"></a>
## Cài đặt

Xem hướng dẫn cài đặt trong [cổng tài liệu của Checkmate](https://checkmate.so/docs).

Hoặc bạn có thể dùng [Coolify](https://coolify.io/), [Elestio](https://elest.io/open-source/checkmate), [K8s](./charts/helm/checkmate/INSTALLATION.md), [Sive Host](https://sive.host) (Nam Phi), [Cloudzy](https://cloudzy.com/marketplace/checkmate) hoặc [Pikapods](https://www.pikapods.com/) để dựng nhanh một instance Checkmate. Nếu muốn giám sát hạ tầng máy chủ, bạn sẽ cần [agent Capture](https://github.com/bluewave-labs/capture). Kho Capture cũng chứa hướng dẫn cài đặt.

### Sử dụng CA tuỳ chỉnh

Nếu bạn cần giám sát các endpoint HTTPS nội bộ với chứng chỉ từ các tổ chức phát hành riêng (ví dụ Smallstep), hãy xem [Hướng dẫn tin cậy CA tuỳ chỉnh](../custom-ca-trust.md) với các tuỳ chọn cấu hình Docker.

Để biết thêm tài liệu, xem [thư mục docs](../).

<a id="performance"></a>
## Hiệu năng

Nhờ tối ưu rộng rãi, Checkmate hoạt động với mức sử dụng bộ nhớ rất nhỏ, chỉ cần lượng RAM và CPU tối thiểu. Dưới đây là mức sử dụng bộ nhớ của một instance Node.js trên máy chủ giám sát 323 máy chủ mỗi phút:

![image](https://github.com/user-attachments/assets/37e04a75-d83a-488f-b25c-025511b492c9)

Bạn cũng có thể thấy dung lượng bộ nhớ của MongoDB và Redis trên cùng máy chủ (398MB và 15MB) cho cùng số lượng máy chủ:

![image](https://github.com/user-attachments/assets/3b469e85-e675-4040-a162-3f24c1afc751)

<a id="questions--ideas"></a>
## Câu hỏi & ý tưởng

Nếu bạn có câu hỏi, góp ý hoặc bình luận, có một vài tuỳ chọn:

- [Kênh Discord](https://discord.gg/NAb6H3UTjK) (khuyến nghị)
- [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) (chúng tôi sẽ ghé qua đều đặn)

Đừng ngần ngại hỏi hoặc chia sẻ ý tưởng — chúng tôi rất mong nghe ý kiến của bạn!

<a id="features"></a>
## Tính năng

- Hoàn toàn mã nguồn mở, có thể triển khai trên máy chủ riêng hoặc thiết bị tại nhà (ví dụ Raspberry Pi 4 hoặc 5)
- Nhiều tuỳ chọn giám sát: thời gian hoạt động, Docker, Ping, SSL, cổng, máy chủ game
- Giám sát tốc độ tải trang
- Giám sát hạ tầng (bộ nhớ, ổ đĩa, hiệu năng CPU, mạng, v.v.) — yêu cầu agent [Capture](https://github.com/bluewave-labs/capture)
  - Giám sát ổ đĩa có chọn lọc với lựa chọn điểm gắn kết
- Quản lý sự cố một cái nhìn
- Trang trạng thái với 4 theme đẹp mắt
- Thông báo qua e-mail, webhook, Discord, Slack, PagerDuty, Matrix, Microsoft Teams, Telegram, Pushover, Twilio (SMS)
- Bảo trì theo lịch
- Giám sát qua truy vấn JSON
- Hỗ trợ đa ngôn ngữ: Ả Rập, Trung Quốc (giản thể), Trung Quốc (phồn thể, Đài Loan), Séc, Anh, Phần Lan, Pháp, Đức, Nhật, Bồ Đào Nha (Brazil), Nga, Tây Ban Nha, Thái, Thổ Nhĩ Kỳ, Ukraine và Việt Nam


## Vòng đời của một monitor

1. Một monitor thực hiện kiểm tra (HTTP / Ping / cổng / phần cứng qua agent Capture)
2. Kết quả được lưu lại (thành công/thất bại + thời gian phản hồi)
3. Các kết quả gần đây được đánh giá dựa trên ngưỡng thay đổi trạng thái đã cấu hình
4. Nếu đạt ngưỡng và trạng thái hiện tại khác trạng thái trước đó, trạng thái monitor sẽ thay đổi (ví dụ `initializing`, `up`, `down`, `breached`)
5. Khi trạng thái thay đổi, một sự cố sẽ được tạo hoặc giải quyết tuỳ vào trạng thái hiện tại
6. Thông báo được kích hoạt theo cấu hình

<a id="screenshots"></a>
## Ảnh chụp màn hình

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
- Và rất nhiều thành phần mã nguồn mở khác!

<a id="a-few-links"></a>
## Một vài liên kết

- Nếu bạn muốn ủng hộ chúng tôi, hãy cân nhắc cho dự án một ⭐ và nhấn "watch".
- Có câu hỏi hoặc gợi ý cho roadmap/tính năng? Hãy ghé [kênh Discord](https://discord.gg/NAb6H3UTjK) hoặc diễn đàn [Discussions](https://github.com/bluewave-labs/checkmate/discussions).
- Muốn nhận thông báo khi có bản phát hành mới? Hãy dùng [Newreleases](https://newreleases.io/) — dịch vụ miễn phí theo dõi phiên bản phát hành.
- Xem video [cài đặt và sử dụng Checkmate](https://www.youtube.com/watch?v=GfFOc0xHIwY)

<a id="contributing"></a>
## Đóng góp

Chúng tôi là [Alex](http://github.com/ajhollid) (trưởng nhóm), [Gorkem](http://github.com/gorkem-bwl/), [Aryaman](https://github.com/Br0wnHammer), [Mert](https://github.com/mertssmnoglu) và [Karen](https://github.com/karenvicent), hỗ trợ cá nhân và doanh nghiệp giám sát hạ tầng và máy chủ.

Chúng tôi tự hào xây dựng những mối liên kết bền chặt với người đóng góp ở mọi cấp độ. Dù còn trẻ, Checkmate đã có hơn 7000 sao và thu hút hơn 90 người đóng góp trên khắp thế giới.

Kho của chúng tôi đã được nhân viên của **Google, Microsoft, Intel, Cisco, Tencent, Electronic Arts, ByteDance, JP Morgan Chase, Deloitte, Accenture, Foxconn, Broadcom, China Telecom, Barclays, Capgemini, Wipro, Cloudflare, Dassault Systèmes và NEC** đánh sao — đừng ngần ngại, hãy tham gia, đóng góp và học hỏi cùng chúng tôi!

Cách bạn có thể đóng góp:

0. Đánh sao cho repo này :)
1. Đọc [hướng dẫn dành cho người đóng góp](https://github.com/bluewave-labs/Checkmate/blob/develop/CONTRIBUTING.md). Người mới được khuyến khích kiểm tra tag `good-first-issue`.
2. Nếu muốn đi sâu vào kiến trúc, đọc [cấu trúc chi tiết của Checkmate](https://deepwiki.com/bluewave-labs/Checkmate).
3. Mở issue nếu bạn cho rằng đã gặp lỗi.
4. Nếu mới tham gia, hãy tìm các issue gắn nhãn `good-first-issue`.
5. Tạo pull request để thêm tính năng mới, cải thiện trải nghiệm hoặc sửa lỗi.
6. Xem qua bản hướng dẫn tương tác về codebase `Checkmate` trên CodeCanvas [tại đây](https://www.code-canvas.com/?session=unauthenticatedGithub&repo=Checkmate&owner=bluewave-labs&branch=develop&OnboardingTutorial=true). Để hoàn thiện mô phỏng luồng dữ liệu hiện có hoặc tạo mới, xem hướng dẫn nhanh [tại đây](https://docs.code-canvas.com/updating-diagram).

<a href="https://github.com/bluewave-labs/checkmate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluewave-labs/checkmate" />
</a>

[![Star History Chart](https://api.star-history.com/svg?repos=bluewave-labs/checkmate&type=Date)](https://star-history.com/#bluewave-labs/Checkmate&Date)
