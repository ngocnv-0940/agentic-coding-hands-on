# Awards Information — Vietnamese copy (verbatim from Figma, frame `313:8436`)

Source: MoMorph `query_by_type TEXT` on screenId `zFYDgyj_pD` (the `character` field = the instance override; `itemName` is only the master layer name and must NOT be used as copy). Trailing spaces trimmed; nothing paraphrased.

## Hero / title
| Node | Text |
|---|---|
| `313:8454` caption | `Sun* Annual Awards 2025` |
| `313:8457` title (h1, gold) | `Hệ thống giải thưởng SAA 2025` |

NOTE: `e2e/awards-information-access-and-content.spec.ts:91` expects the caption `Sun* annual awards 2025` (lowercase "annual awards"); Figma says `Sun* Annual Awards 2025`. Phase 3 must reconcile (Figma wins per clarifications, but the RED test is case-sensitive via `toHaveText`).

## Category menu (C.1–C.6, order = BR-001)
| Node | slug | Label |
|---|---|---|
| `I313:8460;186:1502` | top-talent | `Top Talent` |
| `I313:8461;186:1439` | top-project | `Top Project` |
| `I313:8462;186:1439` | top-project-leader | `Top Project\nLeader` (Figma wraps at a fixed 86px text width; use `Top Project Leader`) |
| `I313:8463;186:1439` | best-manager | `Best Manager` |
| `I313:8464;186:1439` | signature-2025-creator | `Signature 2025 \nCreator` (wrap; use `Signature 2025 - Creator`, which is the D.5 title `313:8478` and the locators constant) |
| `I313:8465;186:1439` | mvp | `MVP` |

## Award details (D.1–D.6)
Shared labels: `Số lượng giải thưởng:` (`I313:8467;214:2536`), `Giá trị giải thưởng:` (`I313:8467;214:2544`), separator `Hoặc` (`313:8499`, Signature only).

### D.1 top-talent (`313:8467`)
- title `I313:8467;214:2530`: `Top Talent`
- description `I313:8467;214:2531`: `Giải thưởng Top Talent vinh danh những cá nhân xuất sắc toàn diện – những người không ngừng khẳng định năng lực chuyên môn vững vàng, hiệu suất công việc vượt trội, luôn mang lại giá trị vượt kỳ vọng, được đánh giá cao bởi khách hàng và đồng đội. Với tinh thần sẵn sàng nhận mọi nhiệm vụ tổ chức giao phó, họ luôn là nguồn cảm hứng, thúc đẩy động lực và tạo ảnh hưởng tích cực đến cả tập thể.`
- quantity: value `10` (`I313:8467;214:2538`), unit `Cá nhân` (`I313:8467;214:3532`)
- prize: `7.000.000 VNĐ` (`I313:8467;214:2546`), note `cho mỗi giải thưởng` (`I313:8467;214:2547`)
- NOTE: the RED test expects quantity `10 Đơn vị` (the master layer name `Đơn vị`); Figma's override is `Cá nhân`. Phase 3 must decide; Figma text is `Cá nhân`.

### D.2 top-project (`313:8468`)
- title `I313:8468;214:2622`: `Top Project`
- description `I313:8468;214:2623`: `Giải thưởng Top Project vinh danh các tập thể dự án xuất sắc với kết quả kinh doanh vượt kỳ vọng, hiệu quả vận hành tối ưu và tinh thần làm việc tận tâm. Đây là các dự án có độ phức tạp kỹ thuật cao, hiệu quả tối ưu hóa nguồn lực và chi phí tốt, đề xuất các ý tưởng có giá trị cho khách hàng, đem lại lợi nhuận vượt trội và nhận được phản hồi tích cực từ khách hàng. Các thành viên tuân thủ nghiêm ngặt các tiêu chuẩn phát triển nội bộ trong phát triển dự án, tạo nên một hình mẫu về sự xuất sắc và chuyên nghiệp.`
- quantity: `02` (`I313:8468;214:2630`), unit `Tập thể` (`I313:8468;214:3615`)
- prize: `15.000.000 VNĐ` (`I313:8468;214:2638`), note `cho mỗi giải thưởng` (`I313:8468;214:2639`)

### D.3 top-project-leader (`313:8469`)
- title `I313:8469;214:2530`: `Top Project Leader`
- description `I313:8469;214:2531`: `Giải thưởng Top Project Leader vinh danh những nhà quản lý dự án xuất sắc – những người hội tụ năng lực quản lý vững vàng, khả năng truyền cảm hứng mạnh mẽ, và tư duy “Aim High – Be Agile” trong mọi bài toán và bối cảnh. Dưới sự dẫn dắt của họ, các thành viên không chỉ cùng nhau vượt qua thử thách và đạt được mục tiêu đề ra, mà còn giữ vững ngọn lửa nhiệt huyết, tinh thần Wasshoi, và trưởng thành để trở thành phiên bản tinh hoa – hạnh phúc hơn của chính mình.`
- quantity: `03` (`I313:8469;214:2538`), unit `Cá nhân` (`I313:8469;214:3532`)
- prize: `7.000.000 VNĐ` (`I313:8469;214:2546`), note `cho mỗi giải thưởng` (`I313:8469;214:2547`)

### D.4 best-manager (`313:8470`)
- title `I313:8470;214:2622`: `Best Manager`
- description `I313:8470;214:2623`: `Giải thưởng Best Manager vinh danh những nhà lãnh đạo tiêu biểu – người đã dẫn dắt đội ngũ của mình tạo ra kết quả vượt kỳ vọng, tác động nổi bật đến hiệu quả kinh doanh và sự phát triển bền vững của tổ chức. Dưới sự lãnh đạo của họ, đội ngũ luôn chinh phục và làm chủ mọi mục tiêu bằng năng lực đa nhiệm, khả năng phối hợp hiệu quả, và tư duy ứng dụng công nghệ linh hoạt trong kỷ nguyên số. Họ truyền cảm hứng để tập thể trở nên tự tin tràn đầy năng lượng, sẵn sàng đón nhận, thậm chí dẫn dắt tạo ra những thay đổi có tính cách mạng.`
- quantity: `01` (`I313:8470;214:2630`), unit `Cá nhân` (`I313:8470;214:3615`)
- prize: `10.000.000 VNĐ` (`I313:8470;214:2638`), note: none (the D.4 frame has no note layer)

### D.5 signature-2025-creator (`313:8471`)
- title `313:8478`: `Signature 2025 - Creator`
- description `313:8479` (Figma shows a paragraph break where the text has two spaces after "thời kỳ."; store as `\n\n`, rendered by `whitespace-pre-line`): `Giải thưởng Signature vinh danh cá nhân hoặc tập thể thể hiện tinh thần đặc trưng mà Sun* hướng tới trong từng thời kỳ.` ¶ `Trong năm 2025, giải thưởng Signature vinh danh Creator - cá nhân/tập thể mang tư duy chủ động và nhạy bén, luôn nhìn thấy cơ hội trong thách thức và tiên phong trong hành động. Họ là những người nhạy bén với vấn đề, nhanh chóng nhận diện và đưa ra những giải pháp thực tiễn, mang lại giá trị rõ rệt cho dự án, khách hàng hoặc tổ chức. Với tư duy kiến tạo và tinh thần “Creator” đặc trưng của Sun*, họ không chỉ phản ứng tích cực trước sự thay đổi mà còn chủ động tạo ra cải tiến, góp phần định hình chuẩn mực mới cho cách mà người Sun* tạo giá trị.`
- quantity: `01` (`313:8487`), unit `Cá nhân hoặc tập thể` (`313:8488`)
- prize 1: `5.000.000 VNĐ` (`313:8496`), note `cho giải cá nhân` (`313:8497`)
- separator: `Hoặc` (`313:8499`)
- prize 2: `8.000.000 VNĐ` (`313:8507`), note `cho giải tập thể` (`313:8508`)

### D.6 mvp (`313:8510`)
- title `I313:8510;214:2622`: `MVP (Most Valuable Person)`
- description `I313:8510;214:2623` (two paragraphs; the image shows a blank line after "suốt năm qua."): `Giải thưởng MVP vinh danh cá nhân xuất sắc nhất năm – gương mặt tiêu biểu đại diện cho toàn bộ tập thể Sun*. Họ là người đã thể hiện năng lực vượt trội, tinh thần cống hiến bền bỉ, và tầm ảnh hưởng sâu rộng, để lại dấu ấn mạnh mẽ trong hành trình của Sun* suốt năm qua.` ¶ `Không chỉ nổi bật bởi hiệu suất và kết quả công việc, họ còn là nguồn cảm hứng lan tỏa – thông qua suy nghĩ, hành động và ảnh hưởng tích cực của mình đối với tập thể. MVP là người hội tụ đầy đủ phẩm chất của người Sun* ưu tú, đồng thời mang trên mình trọng trách lớn lao: trở thành hình mẫu đại diện cho con người và tinh thần Sun*, góp phần dẫn dắt tập thể vươn tới những đỉnh cao mới.`
- quantity: `01` (`I313:8510;214:2630`), unit `Cá nhân` (`I313:8510;214:3615`)
- prize: `15.000.000 VNĐ` (`I313:8510;214:2638`), note: none

## Sun* Kudos block (`335:12023`)
| Node | Text |
|---|---|
| `I335:12023;313:8421` eyebrow | `Phong trào ghi nhận` |
| `I335:12023;313:8422` title | `Sun* Kudos` |
| `I335:12023;313:8423` body | `ĐIỂM MỚI CỦA SAA 2025\nHoạt động ghi nhận và cảm ơn đồng nghiệp - lần đầu tiên được diễn ra dành cho tất cả Sunner. Hoạt động sẽ được triển khai vào tháng 11/2025, khuyến khích người Sun* chia sẻ những lời ghi nhận, cảm ơn đồng nghiệp trên hệ thống do BTC công bố. Đây sẽ là chất liệu để Hội đồng Heads tham khảo trong quá trình lựa chọn người đạt giải.` |
| `I335:12023;313:8426;186:1568` button | `Chi tiết` |
| `I335:12023;329:2949` logo text | `KUDOS` (artwork) |

### Does node `335:12023` match homepage `KudosPromo`?
Copy: identical (same child node ids as the homepage instance `3390:10349`: `313:8416/8419/8420/8421/8422/8423/8426/2948`). Geometry differs: Figma block is 1152x500 (homepage 1120), text column 457px (homepage 425px), KUDOS logo right offset 79px (homepage 84px). Resolution: additive `variant?: 'default' | 'wide'` prop on `KudosPromo`; default render unchanged.
