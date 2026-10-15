---
status: draft
authored_by: takumi
created: 2026-10-15
lang: vi
---

**Priority**: P1
**Type**: ui

## 1. Overview

**Problem:** Trên `/sun-kudos` Sunner xem được lời cảm ơn của người khác nhưng chưa tự gửi được: thanh "ghi nhận" chỉ mở thông báo "Coming soon", nên Live board không có Kudo mới nào ngoài dữ liệu mẫu.
**Solution:** Bấm thanh ghi nhận để mở modal "Viết Kudo": chọn người nhận, đặt danh hiệu, soạn lời cảm ơn có định dạng (đậm, nghiêng, gạch ngang, danh sách số, trích dẫn, liên kết, nhắc đồng nghiệp bằng "@"), gắn 1 đến 5 hashtag có sẵn, đính tối đa 5 ảnh, tuỳ chọn gửi ẩn danh rồi gửi. Gửi xong Kudo mới nằm đầu danh sách All Kudos.
**Scope:** Modal Viết Kudo mở từ thanh ghi nhận; tìm người nhận; danh hiệu; trình soạn thảo định dạng, hộp thoại chèn liên kết, nhắc tên bằng "@"; chọn hashtag; đính ảnh; gửi ẩn danh; kiểm tra dữ liệu, trạng thái nút Gửi, gửi và báo kết quả; Hủy, Esc, tiêu điểm; chuỗi vi/en; bố cục co giãn; cách lưu Kudo, kho ảnh và bảo mật người gửi ẩn danh.
**Non-Scope:** Sửa hoặc xóa Kudo đã gửi; lưu nháp; thông báo cho người được nhắc bằng "@" hay người nhận; tạo hashtag mới; trang chi tiết Kudo; hộp thoại xác nhận khi Hủy; giới hạn tần suất gửi; hai pill còn lại (tìm profile, Secret Box) vẫn là "Coming soon".

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner gửi Kudos | Nhân viên đã đăng nhập bằng Google; hồ sơ Sunner được tạo tự động ở lần đăng nhập đầu (F006, FR-605) | Gửi lời cảm ơn, ghi nhận tới một đồng nghiệp, công khai hoặc ẩn danh |
| Sunner xem Kudos | Nhân viên khác đã đăng nhập, gồm người nhận | Đọc Kudo mới trên Live board mà không biết được người gửi thật của Kudo ẩn danh |

Feature này mở rộng [F006_KudosLiveBoard](../F006_KudosLiveBoard/functional-spec.md) (thanh ghi nhận, danh sách All Kudos, dữ liệu Kudo) và dựa vào F001_Auth (phiên đăng nhập) và F002_Localization (từ điển vi/en).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Mở và đóng modal Viết Kudo | Bấm thanh ghi nhận để mở modal; đóng bằng Hủy hoặc Esc; tiêu điểm được giữ trong modal và trả về thanh ghi nhận | US001, US012 | FR-101, FR-102, FR-103, FR-104, FR-201, FR-202, FR-221, FR-224, FR-225, FR-226, FR-227 | DEC-006, DEC-008 | SCR007_WriteKudo |
| CAP-02 | Chọn người nhận | Gõ để tìm Sunner theo tên và chọn một người từ danh sách gợi ý | US002 | FR-203, FR-204, FR-205 | BR-008, DEC-009 | — |
| CAP-03 | Soạn nội dung Kudo | Đặt danh hiệu, viết lời cảm ơn có định dạng, chèn liên kết, nhắc đồng nghiệp bằng "@" | US003, US004, US005, US006 | FR-105, FR-206, FR-207, FR-208, FR-209, FR-210, FR-211, FR-605 | BR-003, BR-007, BR-009 | — |
| CAP-04 | Gắn hashtag | Chọn 1 đến 5 hashtag có sẵn, bỏ chọn từng cái | US007 | FR-212, FR-213, FR-214 | BR-004, DEC-003 | — |
| CAP-05 | Đính ảnh | Thêm tối đa 5 ảnh, xem thu nhỏ, xóa từng ảnh | US008 | FR-002, FR-215, FR-216, FR-217 | BR-005, DEC-004 | — |
| CAP-06 | Gửi ẩn danh | Bật ẩn danh, đặt tên ẩn danh tuỳ chọn; người khác chỉ thấy tên ẩn danh | US009 | FR-218, FR-401, FR-402, FR-604 | BR-006, DEC-005 | — |
| CAP-07 | Kiểm tra và gửi Kudo | Thấy lỗi từng trường khi điền thiếu; gửi khi đủ dữ liệu và biết kết quả thành công hay thất bại | US010, US011 | FR-001, FR-003, FR-219, FR-220, FR-222, FR-223, FR-403, FR-601, FR-602, FR-603 | BR-001, BR-002, BR-010, DEC-001, DEC-002, DEC-007, SM-001 | — |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Lối vào và route | **Đã chốt:** modal trên `/sun-kudos`, mở từ thanh ghi nhận; không có route mới; hai pill còn lại giữ "Coming soon" (clarifications.md, 2026-10-15) | Thanh ghi nhận đã có sẵn; phạm vi nhỏ nhất | no |
| D002 | Trường "Danh hiệu" (có trong Figma, không có trong spec MoMorph) | **Đã chốt:** hiển thị, bắt buộc, 1 đến 100 ký tự sau khi bỏ khoảng trắng, lưu làm tiêu đề Kudo | Figma thắng spec; thẻ All Kudos đã có chỗ hiện tiêu đề | no |
| D003 | Nút Gửi: "vô hiệu" hay "bấm vẫn báo lỗi" (spec và test case mâu thuẫn nhau) | **Đã chốt:** nút luôn bấm được nhưng mang trạng thái vô hiệu (mờ, báo cho trình đọc màn hình) khi thiếu trường bắt buộc; bấm khi thiếu thì hiện mọi lỗi và không gửi | Thoả cả hai nhóm test case; người dùng thấy lỗi thay vì nút "chết" | no |
| D004 | Click nền mờ ngoài modal | **Đã chốt:** không làm gì; chỉ Hủy và Esc mới đóng | Tránh mất nội dung dài vì lỡ tay | no |
| D005 | Hashtag tự gõ | **Đã chốt:** chỉ chọn hashtag đã có trong dữ liệu; không tạo mới | Giữ bộ lọc hashtag của Live board gọn | no |
| D006 | Thư viện trình soạn thảo | **Đã chốt hướng:** trình soạn thảo ràng buộc theo lược đồ (gợi ý Tiptap/ProseMirror), thêm một nhóm phụ thuộc cho tính năng này; planner xác nhận phiên bản khớp Next 16 và React 19 | Tự dựng định dạng, danh sách, nhắc tên rủi ro hơn dùng thư viện | no |
| D007 | Người gửi Kudo ẩn danh có thấy danh tính thật của mình trên thẻ không | Đề xuất: không, mọi người kể cả người gửi chỉ thấy tên ẩn danh | Một cách hiển thị duy nhất, không phát sinh nhánh riêng cho người gửi | no |
| D008 | Câu thông báo khi ảnh vượt 5 MB (Figma không có) | Đề xuất: "Ảnh vượt quá 5 MB" | Người dùng cần biết lý do khác với lỗi định dạng | no |
| D009 | Ảnh Kudo đọc công khai theo địa chỉ hay chỉ người đã đăng nhập | Đề xuất: kho ảnh phục vụ công khai theo địa chỉ khó đoán, chỉ người đã đăng nhập mới ghi được vào thư mục của mình | Địa chỉ phục vụ được lưu trực tiếp để hiện ảnh; kho riêng cần địa chỉ ký hết hạn, phức tạp hơn | no |
| D010 | Địa chỉ ảnh của Kudo ẩn danh có được chứa mã người gửi | Đề xuất: không. Ảnh của Kudo ẩn danh nằm ở đường dẫn trung lập; cách tải lên và cách máy chủ kiểm quyền do planner chốt | Địa chỉ chứa mã người gửi sẽ nối các Kudo cùng một người và làm lộ danh tính ẩn danh | yes |
| D011 | Kích thước tối đa của bản định dạng lưu kèm nội dung | Đề xuất: 64 KB | Chặn bản định dạng phình to dù chữ thuần chỉ tối đa 2000 ký tự | no |
| D012 | Giới hạn 2000 ký tự chữ thuần của nội dung (spec không có) | Đề xuất: giữ 2000, do người dựng chọn làm ngưỡng an toàn | Cần một giới hạn để chặn nội dung quá dài | no |
| D013 | Chuỗi mới ngoài Figma: bản tiếng Anh của mọi nhãn và các thông báo lỗi ở § 9 (nội dung quá dài, ảnh vượt 5 MB, quá 5 ảnh, gửi thất bại, liên kết sai) | Đề xuất: người dựng viết cả bản vi lẫn en, chờ người dùng xác nhận | Từ điển vi/en phải đủ khóa | no |
| D014 | Tiêu điểm khi vừa mở modal | Đề xuất: ô Người nhận | Trường đầu tiên và bắt buộc | no |
| D015 | Giới hạn tần suất gửi Kudo | Đề xuất: không giới hạn trong tính năng này | Ngoài phạm vi; ghi nhận ở § 11 | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Kudo lưu được danh hiệu, chữ thuần của lời cảm ơn, bản định dạng của nó, cờ ẩn danh và tên ẩn danh.
- **FR-002** Có kho ảnh riêng cho ảnh Kudo: mỗi người chỉ tải lên được tệp mang tên trung lập (không chứa mã người gửi) và chỉ xóa được tệp của mình chưa được Kudo nào dùng; ảnh định dạng khác hoặc quá 5 MB bị từ chối.
- **FR-003** Kudo, hashtag và ảnh của nó chỉ được ghi qua một thao tác duy nhất phía máy chủ, ghi trọn gói hoặc không ghi gì.

### Navigation (1xx)

- **FR-101** Thanh ghi nhận trên `/sun-kudos` mở modal Viết Kudo; ô tìm profile và Secret Box vẫn mở "Coming soon".
- **FR-102** Chỉ người đã đăng nhập mở được modal; khách bị đưa về `/login` như các trang khác của Live board.
- **FR-103** Người đã đăng nhập mà vì lý do hiếm (hồ sơ Sunner bị gỡ liên kết hoặc xóa) không có hồ sơ thì thấy thanh ghi nhận ở trạng thái vô hiệu. Đây là chốt chặn dự phòng: tài khoản Google luôn có hồ sơ ngay từ lần đăng nhập đầu (F006, FR-605), nên thanh ghi nhận dùng được ngay. Tài khoản đăng ký bằng email và mật khẩu không được tạo hồ sơ, nên vẫn thấy nút vô hiệu.
- **FR-104** Khi modal đóng, tiêu điểm quay về thanh ghi nhận đã mở nó.
- **FR-105** "Tiêu chuẩn cộng đồng" cạnh thanh công cụ mở trang `/standards` trong tab mới.

### Viết Kudo (2xx)

- **FR-201** Modal có tiêu đề ở trên, rồi Người nhận, Danh hiệu, thanh công cụ và ô soạn thảo, Hashtag, Image, ô ẩn danh, Hủy và Gửi, theo đúng thứ tự đó.
- **FR-202** Ô Người nhận ghi "Tìm kiếm", ô soạn thảo ghi "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!", ô ẩn danh mặc định bỏ chọn.
- **FR-203** Gõ từ 1 ký tự trở lên (sau khi bỏ khoảng trắng đầu cuối) thì hiện tối đa 10 Sunner khớp tên, không phân biệt hoa thường và dấu, loại chính người gửi.
- **FR-204** Ký tự đặc biệt như "@ # $" được khớp nguyên văn; không có kết quả thì hiện "Không tìm thấy kết quả".
- **FR-205** Chọn một dòng gợi ý thì tên và ảnh đại diện điền vào ô, danh sách đóng, và ô có nút xóa để chọn lại.
- **FR-206** Ô Danh hiệu bắt buộc (dấu * đỏ), ghi "Dành tặng một danh hiệu cho đồng đội", kèm hai dòng ví dụ và giải thích; nhận 1 đến 100 ký tự.
- **FR-207** Thanh công cụ có in đậm, in nghiêng, gạch ngang, danh sách số, trích dẫn và chèn liên kết; ngoài các định dạng đó không có định dạng nào khác.
- **FR-208** Lời cảm ơn bắt buộc: chữ thuần không được trống sau khi bỏ khoảng trắng và tối đa 2000 ký tự.
- **FR-209** Dưới ô soạn thảo luôn có dòng gợi ý "Bạn có thể “@ + tên” để nhắc tới đồng nghiệp khác"; không có bộ đếm ký tự.
- **FR-210** Nút liên kết mở hộp thoại có ô Text, ô Link, nút Hủy và Lưu; Lưu chèn liên kết rồi đóng hộp thoại.
- **FR-211** Gõ "@" kèm chữ trong ô soạn thảo hiện danh sách Sunner như ô Người nhận; chọn một người chèn tên dạng "@Họ tên" vào nội dung.
- **FR-212** "+ Hashtag" mở danh sách hashtag có sẵn (nhãn có dấu "#"); bấm một dòng để chọn hoặc bỏ chọn, dòng đã chọn đổi màu và có dấu tick.
- **FR-213** Chọn đủ 5 hashtag thì các dòng chưa chọn bị vô hiệu và danh sách hiện "Tối đa 5 hashtag".
- **FR-214** Hashtag đã chọn hiện thành chip dưới nhãn, mỗi chip có nút "x" để gỡ; cần ít nhất 1 hashtag.
- **FR-215** Ảnh nhận định dạng JPEG, PNG, WebP, mỗi ảnh tối đa 5 MB; tệp khác (pdf, mp4, txt) không được thêm và hiện "Định dạng file không hợp lệ".
- **FR-216** Tối đa 5 ảnh, mỗi ảnh hiện thu nhỏ ngay kèm nút "x"; đủ 5 ảnh thì nút "+ Image" ẩn, xóa bớt thì hiện lại.
- **FR-217** Ảnh chỉ được tải lên khi bấm Gửi, nên hủy giữa chừng không để lại ảnh nào.
- **FR-218** Ô ẩn danh bật thì hiện ô "Tên ẩn danh" (tuỳ chọn, tối đa 50 ký tự); tắt thì ô ẩn đi và giá trị bị xóa.
- **FR-219** Nút Gửi mang trạng thái vô hiệu khi thiếu Người nhận, Danh hiệu, nội dung hoặc hashtag nhưng vẫn bấm được; bấm khi thiếu hiện mọi lỗi và không gửi.
- **FR-220** Trường bắt buộc trống hiện viền đỏ kèm "Không được để trống" (lỗi hashtag ở hàng Hashtag); lỗi hiện khi rời ô đã chạm và mất ngay khi hợp lệ.
- **FR-221** Hủy đóng modal và bỏ mọi thay đổi, không hỏi lại, không gửi gì.
- **FR-222** Khi đang gửi, nút Gửi quay vòng tải, mọi ô nhập và nút Hủy bị khóa.
- **FR-223** Gửi thất bại thì modal giữ nguyên dữ liệu, hiện thông báo lỗi, và ảnh đã tải trong lần gửi đó được xóa cố gắng hết sức.
- **FR-224** Phím Esc đóng modal như Hủy; click nền mờ không làm gì.
- **FR-225** Tiêu điểm bàn phím chỉ quay vòng trong modal khi mở.
- **FR-226** Mọi chuỗi trong modal có bản tiếng Việt và tiếng Anh theo ngôn ngữ đang chọn.
- **FR-227** Modal rộng tối đa 752 px, không vượt chiều rộng màn hình trừ 32 px, cuộn bên trong nếu cao hơn màn hình; dưới 640 px nhãn xếp trên ô nhập và không có thanh cuộn ngang ở 375 px.

### Interaction (4xx)

- **FR-401** Trên Live board, Kudo ẩn danh hiện tên ẩn danh (mặc định "Người gửi ẩn danh"), không ảnh đại diện, không liên kết tới hồ sơ.
- **FR-402** Tim và số "Kudos đã gửi" của Kudo ẩn danh vẫn được tính cho người gửi thật.
- **FR-403** Gửi thành công thì modal đóng, hiện "Đã gửi Kudos thành công!" và Live board nạp lại để Kudo mới đứng đầu All Kudos.

### Security (6xx)

- **FR-601** Chỉ người đã đăng nhập và có hồ sơ Sunner mới gửi được; người gửi luôn lấy từ phiên, không từ dữ liệu trình duyệt gửi lên. Việc gửi không bao giờ tự tạo hồ sơ.
- **FR-602** Không ai gửi Kudo cho chính mình.
- **FR-603** Máy chủ kiểm lại mọi luật nhập liệu (người nhận, danh hiệu, nội dung, hashtag, ảnh, tên ẩn danh, liên kết) vì giao diện không phải chốt chặn.
- **FR-604** Không đường đọc nào, kể cả Live board, truy vấn bảng trực tiếp và địa chỉ ảnh, được cho người khác biết người gửi thật của Kudo ẩn danh.
- **FR-605** Nội dung người dùng không bao giờ được lưu hay hiển thị như HTML thô; liên kết chỉ http hoặc https và mở trong tab mới.

## 5. Business Rules

- Bốn trường bắt buộc là Người nhận, Danh hiệu, nội dung và ít nhất 1 hashtag; ảnh và ẩn danh là tuỳ chọn (BR-001)
- Người gửi lấy từ phiên đăng nhập và không được trùng người nhận (BR-002)
- Nội dung lưu cả chữ thuần (hiện trên Live board; tên nhắc "@" thành "@Họ tên") lẫn bản định dạng; chữ thuần 1 đến 2000 ký tự sau khi bỏ khoảng trắng (BR-003)
- Hashtag đã chọn từ 1 đến 5, đều có sẵn trong dữ liệu, không trùng nhau (BR-004)
- Ảnh tối đa 5, chỉ JPEG, PNG, WebP, mỗi ảnh tối đa 5 MB, tải lên khi gửi với tên tệp trung lập `<uuid>.<ext>`, máy chủ kiểm tệp do chính người gửi tải lên và chưa dùng (BR-005)
- Tên ẩn danh tối đa 50 ký tự; để trống thì hiển thị "Người gửi ẩn danh"; người gửi thật vẫn được lưu để tính tim và số liệu (BR-006)
- Liên kết chỉ nhận http hoặc https, dài 5 đến 2048 ký tự, phần chữ 1 đến 100 ký tự không toàn khoảng trắng; máy chủ kiểm lại (BR-007)
- Tìm người nhận bỏ khoảng trắng đầu cuối, không phân biệt hoa thường và dấu, khớp theo tên, tối đa 10 kết quả, loại chính người gửi (BR-008)
- Danh hiệu dài 1 đến 100 ký tự sau khi bỏ khoảng trắng (BR-009)
- Gửi thất bại thì giữ nguyên dữ liệu đã nhập; ảnh đã tải được dọn khi bị từ chối chắc chắn, còn khi kết quả không rõ (lỗi mạng) thì giữ lại vì Kudo có thể đã được ghi (BR-010)
- Nút Gửi mờ và báo vô hiệu khi còn thiếu trường bắt buộc, bấm vẫn được để xem lỗi; đủ thì sáng bình thường (DEC-001)
- Lỗi của một trường hiện khi bấm Gửi hoặc khi rời ô đã chạm mà còn trống, và biến mất ngay khi trường hợp lệ (DEC-002)
- Đủ 5 hashtag thì các dòng chưa chọn bị vô hiệu kèm "Tối đa 5 hashtag"; gỡ bớt thì mở lại (DEC-003)
- Dưới 5 ảnh thì thấy nút "+ Image"; đủ 5 ảnh thì ẩn nút (DEC-004)
- Bật ẩn danh thì hiện ô "Tên ẩn danh"; tắt thì ẩn ô và xóa giá trị (DEC-005)
- Hủy và Esc đóng modal và bỏ dữ liệu; click nền mờ không làm gì (DEC-006)
- Đang gửi thì khóa mọi ô nhập, Hủy và hiện vòng tải ở nút Gửi (DEC-007)
- Người dùng không có hồ sơ Sunner (chỉ còn khi hồ sơ bị gỡ liên kết hoặc xóa, hoặc tài khoản không phải Google) thì thanh ghi nhận vô hiệu, cùng luật với nút tim (DEC-008)
- Tìm người nhận không ra ai thì hiện "Không tìm thấy kết quả" (DEC-009)
- Modal đi qua ba trạng thái: đóng, đang soạn, đang gửi; gửi thành công thì về đóng, thất bại thì về đang soạn (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Viết Kudo (modal trên Live board) | SCR007_WriteKudo | Hộp thoại giữa màn hình, nền mờ phía sau: tiêu đề, Người nhận, Danh hiệu, thanh công cụ và ô soạn thảo, Hashtag, Image, ô ẩn danh, Hủy và Gửi | Chọn người nhận, đặt danh hiệu, soạn lời cảm ơn, chèn liên kết, nhắc tên, chọn hashtag, đính ảnh, bật ẩn danh, Hủy hoặc Gửi |

### User Journey

1. Sunner đang xem Live board bấm thanh ghi nhận và thấy modal Viết Kudo hiện trên nền mờ.
2. Sunner gõ tên vào ô Người nhận, chọn một đồng nghiệp trong danh sách gợi ý.
3. Sunner điền Danh hiệu rồi viết lời cảm ơn, có thể định dạng, chèn liên kết hoặc nhắc thêm đồng nghiệp bằng "@".
4. Sunner chọn từ 1 đến 5 hashtag, tuỳ chọn thêm ảnh và bật ẩn danh.
5. Sunner bấm Gửi; nút quay vòng tải. Nếu thiếu trường, lỗi hiện ngay tại từng trường và không gửi gì.
6. Gửi xong, modal đóng, thông báo thành công hiện lên và Live board cho thấy Kudo mới ở đầu All Kudos.

## 7. User Stories

### US001 — Mở modal Viết Kudo từ thanh ghi nhận

**Actor:** Sunner gửi Kudos
**Goal:** Mở modal để bắt đầu viết một Kudo.
**Business value:** Biến thanh ghi nhận từ lối vào "Coming soon" thành đường gửi Kudo thật.

**Acceptance Criteria:**
- [ ] Đã đăng nhập, bấm thanh ghi nhận thì modal hiện đủ tiêu đề và các trường theo thứ tự (ID-0, ID-2, ID-3)
- [ ] Khách chưa đăng nhập không tới được modal, bị đưa về trang đăng nhập (ID-1)
- [ ] Ô Người nhận và ô soạn thảo hiện đúng chữ gợi ý, ô ẩn danh mặc định bỏ chọn (ID-4, ID-5, ID-6)
- [ ] Người không có hồ sơ Sunner (hiếm; tài khoản Google mới luôn có hồ sơ) thấy thanh ghi nhận vô hiệu

### US002 — Chọn người nhận bằng tìm kiếm

**Actor:** Sunner gửi Kudos
**Goal:** Tìm và chọn đúng đồng nghiệp muốn cảm ơn.
**Business value:** Kudo luôn gắn với một Sunner có thật, không gõ sai tên.

**Acceptance Criteria:**
- [ ] Gõ "Nguyễn" hoặc "An" thì hiện gợi ý chứa chuỗi đó, cập nhật khi gõ (ID-8, ID-25)
- [ ] Khoảng trắng đầu cuối bị bỏ qua (ID-10); "@ # $" cho ra danh sách lọc đúng hoặc "Không tìm thấy kết quả" (ID-9)
- [ ] Chọn một dòng thì tên điền vào ô và danh sách đóng (ID-26)
- [ ] Mỗi dòng có ảnh đại diện, họ tên, phòng ban; người gửi không có trong danh sách

### US003 — Đặt danh hiệu cho Kudo

**Actor:** Sunner gửi Kudos
**Goal:** Đặt một danh hiệu ngắn làm tiêu đề cho lời cảm ơn.
**Business value:** Thẻ Kudo trên Live board có tiêu đề dễ nhớ, đúng thiết kế Figma.

**Acceptance Criteria:**
- [ ] Ô Danh hiệu có dấu * đỏ, chữ gợi ý và hai dòng ví dụ như thiết kế
- [ ] Nhận 1 đến 100 ký tự sau khi bỏ khoảng trắng; để trống thì báo "Không được để trống"
- [ ] Danh hiệu đã gửi hiện làm tiêu đề trên thẻ ở All Kudos

### US004 — Soạn lời cảm ơn có định dạng

**Actor:** Sunner gửi Kudos
**Goal:** Viết lời cảm ơn và làm nổi bật ý chính bằng định dạng.
**Business value:** Lời cảm ơn dễ đọc, nhấn đúng chỗ, không cần ký hiệu thủ công.

**Acceptance Criteria:**
- [ ] Chọn chữ rồi bấm B, I, S thì chữ đậm, nghiêng, gạch ngang (ID-27, ID-28, ID-29)
- [ ] Bấm nút danh sách số thì các dòng được đánh số (ID-30)
- [ ] Bấm nút trích dẫn thì đoạn chọn thành khối trích dẫn (ID-32)
- [ ] Để trống nội dung rồi bấm Gửi thì báo "Không được để trống" (ID-11, ID-51)
- [ ] Dòng gợi ý "@ + tên" luôn hiện, không có bộ đếm ký tự; "Tiêu chuẩn cộng đồng" mở tab mới

### US005 — Chèn liên kết vào lời cảm ơn

**Actor:** Sunner gửi Kudos
**Goal:** Gắn một đường dẫn vào đoạn chữ trong lời cảm ơn.
**Business value:** Người nhận mở thẳng tài liệu hoặc bài viết được nhắc tới.

**Acceptance Criteria:**
- [ ] Bấm nút liên kết thì hộp thoại có Text, Link, Hủy, Lưu hiện lên (ID-31)
- [ ] Nhập "https://example.com" rồi Lưu thì liên kết được chèn và hộp thoại đóng (ID-31)
- [ ] Text hoặc Link trống, hoặc Link không phải http hoặc https, thì báo lỗi và không chèn
- [ ] Liên kết đã gửi mở trong tab mới

### US006 — Nhắc đồng nghiệp bằng "@"

**Actor:** Sunner gửi Kudos
**Goal:** Nhắc tên một đồng nghiệp khác ngay trong lời cảm ơn.
**Business value:** Lời cảm ơn gắn đúng người được nhắc tới, đọc là biết ai.

**Acceptance Criteria:**
- [ ] Gõ "Cảm ơn @" hoặc "@Nguyen" thì hiện danh sách Sunner để chọn (ID-12, ID-33)
- [ ] Chọn "NguyenVanA" thì tên được chèn đúng vào nội dung (ID-13)
- [ ] Tên nhắc hiện trên Live board dạng "@Họ tên"

### US007 — Chọn hashtag cho Kudo

**Actor:** Sunner gửi Kudos
**Goal:** Gắn từ 1 đến 5 hashtag mô tả giá trị mà Kudo ghi nhận.
**Business value:** Kudo lọc và tìm được theo hashtag trên Live board.

**Acceptance Criteria:**
- [ ] "+ Hashtag" mở danh sách; chọn thì thành chip, chọn nhiều thì nhiều chip riêng (ID-34, ID-35)
- [ ] Bấm "x" trên một chip chỉ gỡ chip đó (ID-36)
- [ ] Chọn đủ 5 thì nút vẫn thấy, các dòng còn lại vô hiệu và hiện "Tối đa 5 hashtag"; không thêm được cái thứ 6 (ID-16, ID-17, ID-53)
- [ ] Có 1 hashtag là đủ điều kiện gửi (ID-15)

### US008 — Đính ảnh vào Kudo

**Actor:** Sunner gửi Kudos
**Goal:** Đính tối đa 5 ảnh làm kỷ niệm cho lời cảm ơn.
**Business value:** Kudo có ảnh thật của đội, gần với thiết kế và tăng giá trị ghi nhận.

**Acceptance Criteria:**
- [ ] Chọn 1 đến 5 ảnh JPEG hoặc PNG thì thu nhỏ hiện ngay; còn dưới 5 thì nút "+ Image" vẫn hiện (ID-18, ID-21, ID-22, ID-37)
- [ ] Đủ 5 ảnh thì nút "+ Image" ẩn, không thêm được ảnh thứ 6 (ID-19, ID-20, ID-38, ID-54)
- [ ] Xóa một ảnh thì chỉ ảnh đó mất; đang đủ 5 mà xóa thì nút hiện lại (ID-39, ID-40)
- [ ] Tệp pdf, mp4, txt bị từ chối, hiện "Định dạng file không hợp lệ" (ID-23, ID-24, ID-55)

### US009 — Gửi Kudo ẩn danh

**Actor:** Sunner gửi Kudos
**Goal:** Gửi lời cảm ơn mà không để lộ mình là người gửi.
**Business value:** Sunner dám ghi nhận thoải mái; danh tính người gửi được giữ kín với mọi người còn lại.

**Acceptance Criteria:**
- [ ] Bấm ô ẩn danh thì được chọn, bấm lại thì bỏ chọn (ID-41, ID-42)
- [ ] Chọn thì ô "Tên ẩn danh" hiện, bỏ chọn thì ô ẩn (ID-43, ID-44)
- [ ] Kudo đã gửi hiện tên ẩn danh (mặc định "Người gửi ẩn danh"), không ảnh đại diện, không liên kết hồ sơ
- [ ] Người khác không biết được người gửi thật qua Live board, truy vấn trực tiếp hay địa chỉ ảnh; tim vẫn tính cho người gửi thật

### US010 — Thấy lỗi khi điền thiếu

**Actor:** Sunner gửi Kudos
**Goal:** Biết ngay trường nào còn thiếu trước khi gửi.
**Business value:** Không gửi nhầm Kudo thiếu thông tin và không phải đoán lỗi.

**Acceptance Criteria:**
- [ ] Mọi trường bắt buộc trống thì nút Gửi mờ và báo vô hiệu; đủ Người nhận, nội dung, hashtag (và Danh hiệu) thì nút sáng (ID-48, ID-49)
- [ ] Bấm Gửi khi thiếu thì hiện lỗi tại Người nhận, Danh hiệu, nội dung, Hashtag cùng lúc và không gửi (ID-7, ID-11, ID-14, ID-50, ID-51, ID-52, ID-56)
- [ ] Lỗi mất ngay khi trường hợp lệ

### US011 — Gửi Kudos

**Actor:** Sunner gửi Kudos
**Goal:** Gửi Kudo đã điền đủ và biết nó đã tới nơi.
**Business value:** Hoàn tất việc ghi nhận đồng nghiệp; Kudo xuất hiện ngay cho mọi người thấy.

**Acceptance Criteria:**
- [ ] Đủ trường bắt buộc kèm 2 hashtag và 2 ảnh thì gửi được: nút quay vòng tải, modal đóng khi xong (ID-46)
- [ ] Đủ trường bắt buộc, 1 hashtag, không ảnh cũng gửi được (ID-47)
- [ ] Thành công thì hiện "Đã gửi Kudos thành công!" và Kudo mới đứng đầu All Kudos
- [ ] Thất bại thì modal giữ nguyên dữ liệu và hiện thông báo lỗi

### US012 — Hủy và đóng modal

**Actor:** Sunner gửi Kudos
**Goal:** Thoát khỏi modal mà không gửi gì.
**Business value:** Người dùng đổi ý không bị ép gửi hay phải xác nhận.

**Acceptance Criteria:**
- [ ] Đã nhập dữ liệu, bấm Hủy thì modal đóng, không lưu gì (ID-45)
- [ ] Esc đóng như Hủy; click nền mờ không làm gì
- [ ] Đóng xong, tiêu điểm quay về thanh ghi nhận

## 8. Scenarios

### US001 — Happy Path

**Given** Sunner đã đăng nhập, đang ở `/sun-kudos`, **When** bấm thanh ghi nhận, **Then** modal Viết Kudo hiện đủ tiêu đề và các trường theo thứ tự (ID-0, ID-3).

### US001 — Error: chưa đăng nhập hoặc chưa có hồ sơ *(đổi lời)*

**Given** khách chưa đăng nhập, **When** mở `/sun-kudos`, **Then** bị đưa về trang đăng nhập (ID-1); **Given** người đã đăng nhập nhưng hồ sơ Sunner bị gỡ liên kết hoặc xóa (tài khoản Google mới không rơi vào trường hợp này), **When** nhìn thanh ghi nhận, **Then** nút vô hiệu và không mở được modal.

### US002 — Happy Path

**Given** modal đang mở, **When** gõ "An" rồi chọn "Nguyễn Văn An", **Then** tên điền vào ô Người nhận và danh sách đóng (ID-25, ID-26).

### US002 — Error: không có kết quả

**Given** modal đang mở, **When** gõ "@ # $", **Then** hiện "Không tìm thấy kết quả" hoặc danh sách lọc đúng, không lỗi (ID-9).

### US003 — Happy Path

**Given** modal đang mở, **When** gõ "Người truyền động lực" vào Danh hiệu, **Then** trường hợp lệ, không báo lỗi.

### US003 — Error: danh hiệu trống hoặc quá dài

**Given** Danh hiệu trống hoặc toàn khoảng trắng, **When** bấm Gửi, **Then** viền đỏ và "Không được để trống"; chuỗi dài hơn 100 ký tự không nhập thêm được.

### US004 — Happy Path

**Given** ô soạn thảo có chữ "Cảm ơn bạn", **When** chọn chữ rồi bấm B, **Then** chữ in đậm (ID-27); tương tự với I, S, danh sách số và trích dẫn (ID-28 đến ID-30, ID-32).

### US004 — Error: nội dung trống

**Given** ô soạn thảo trống, **When** bấm Gửi, **Then** hiện "Không được để trống" ngay dưới ô soạn thảo và không gửi (ID-11, ID-51).

### US005 — Happy Path

**Given** đang soạn lời cảm ơn, **When** bấm nút liên kết, nhập Text và "https://example.com" rồi Lưu, **Then** liên kết được chèn và hộp thoại đóng (ID-31).

### US005 — Error: địa chỉ không hợp lệ

**Given** hộp thoại liên kết đang mở, **When** nhập Link "javascript:alert(1)" hoặc để trống Text rồi Lưu, **Then** hiện lỗi tại ô sai, không chèn, hộp thoại giữ nguyên.

### US006 — Happy Path

**Given** đang soạn lời cảm ơn, **When** gõ "Cảm ơn @Nguyen" rồi chọn "NguyenVanA", **Then** tên được chèn vào nội dung (ID-12, ID-13, ID-33).

### US006 — Error: không có ai khớp

**Given** đang soạn lời cảm ơn, **When** gõ "@zzzz", **Then** danh sách hiện "Không tìm thấy kết quả", nội dung đang gõ không bị thay đổi.

### US007 — Happy Path

**Given** danh sách hashtag đang mở, **When** chọn Tag1, Tag2, Tag3, **Then** có 3 chip riêng; bấm "x" trên Tag1 thì chỉ Tag1 mất (ID-35, ID-36).

### US007 — Error: vượt 5 hashtag

**Given** đã chọn 5 hashtag, **When** thử chọn cái thứ 6, **Then** dòng đó vô hiệu, hiện "Tối đa 5 hashtag", không thêm (ID-17, ID-53).

### US008 — Happy Path

**Given** modal đang mở, **When** chọn 3 ảnh .jpg hợp lệ, **Then** có 3 thu nhỏ và nút "+ Image" vẫn hiện; thêm tới 5 ảnh thì nút ẩn (ID-18, ID-19).

### US008 — Error: tệp không phải ảnh

**Given** modal đang mở, **When** chọn tệp .pdf, .mp4 hoặc .txt, **Then** hiện "Định dạng file không hợp lệ" và tệp không được thêm (ID-23, ID-24, ID-55).

### US009 — Happy Path

**Given** ô ẩn danh bỏ chọn, **When** bấm vào ô, **Then** ô được chọn và hiện ô "Tên ẩn danh"; bấm lại thì ô ẩn đi (ID-41 đến ID-44).

### US009 — Error: người khác dò danh tính

**Given** một Kudo ẩn danh đã gửi, **When** Sunner khác xem Live board hoặc truy vấn thẳng dữ liệu, **Then** chỉ thấy tên ẩn danh; không đường nào cho biết người gửi thật.

### US010 — Happy Path

**Given** Người nhận, Danh hiệu, nội dung và 1 hashtag đã đủ, **When** nhìn nút Gửi, **Then** nút sáng bình thường (ID-49).

### US010 — Error: bấm Gửi khi thiếu

**Given** mọi trường bắt buộc trống, **When** bấm Gửi, **Then** viền đỏ và lỗi hiện đồng thời ở Người nhận, Danh hiệu, nội dung, Hashtag và không gửi (ID-7, ID-11, ID-14, ID-48, ID-56).

### US011 — Happy Path

**Given** form đủ dữ liệu kèm 2 hashtag và 2 ảnh, **When** bấm Gửi, **Then** nút quay vòng tải, modal đóng, hiện "Đã gửi Kudos thành công!" và Kudo mới đứng đầu All Kudos (ID-46).

### US011 — Error: gửi thất bại

**Given** form đủ dữ liệu nhưng máy chủ từ chối hoặc mất mạng, **When** bấm Gửi, **Then** modal giữ nguyên mọi dữ liệu đã nhập, hiện thông báo lỗi, ảnh đã tải của lần đó bị dọn.

### US012 — Happy Path

**Given** đã nhập dữ liệu, **When** bấm Hủy, **Then** modal đóng, không có Kudo nào được lưu và tiêu điểm về thanh ghi nhận (ID-45).

### US012 — Error: lỡ tay click nền

**Given** đã nhập dữ liệu, **When** click vào nền mờ ngoài modal, **Then** modal vẫn mở và dữ liệu còn nguyên.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Danh hiệu hoặc nội dung toàn khoảng trắng | Coi như trống; bấm Gửi báo lỗi tại trường đó | "Không được để trống" |
| Nội dung chữ thuần vượt 2000 ký tự | Không cho gửi; lỗi hiện tại ô soạn thảo | "Nội dung tối đa 2000 ký tự" |
| Chọn ảnh vượt 5 MB | Ảnh không được thêm | "Ảnh vượt quá 5 MB" |
| Chọn cùng lúc nhiều tệp làm vượt 5 ảnh | Chỉ nhận đủ tới 5 ảnh, phần dư bỏ qua | "Tối đa 5 ảnh" |
| Gõ liên tục vào ô Người nhận khi mạng chậm | Chỉ kết quả của chuỗi gõ mới nhất được hiện, kết quả cũ bị bỏ | None — silent handling |
| Bấm Gửi hai lần nhanh | Lần thứ hai bị bỏ qua vì đang gửi; chỉ một Kudo được tạo | None — silent handling |
| Mất mạng hoặc máy chủ từ chối khi gửi | Modal giữ nguyên dữ liệu; ảnh đã tải của lần đó bị dọn | "Không gửi được Kudos. Vui lòng thử lại." |
| Một ảnh tải lên lỗi giữa chừng | Dừng gửi, các ảnh đã tải bị dọn, modal giữ nguyên | "Không gửi được Kudos. Vui lòng thử lại." |
| Người nhận bị xóa khỏi hệ thống giữa lúc soạn | Máy chủ từ chối; modal giữ nguyên dữ liệu | "Không gửi được Kudos. Vui lòng thử lại." |
| Người dùng không có hồ sơ Sunner (chỉ khi hồ sơ bị gỡ liên kết hoặc xóa, hoặc tài khoản không phải Google) | Thanh ghi nhận vô hiệu; máy chủ vẫn từ chối nếu bị gọi trực tiếp | None — nút vô hiệu |
| Người dùng Google mới vừa đăng nhập lần đầu | Thanh ghi nhận bấm được ngay; mở được modal và gửi được | None |
| Bật ẩn danh, gõ tên rồi tắt | Ô tên ẩn đi và giá trị bị xóa; bật lại thì ô trống | None — silent handling |
| Xóa ảnh khi đang đủ 5 ảnh | Nút "+ Image" hiện lại | None — silent handling |
| Nhắc "@" người không tồn tại hoặc gõ "@" rồi xóa | Không chèn mention; chữ đang gõ giữ nguyên | "Không tìm thấy kết quả" |
| Liên kết nhập không phải http hoặc https | Hộp thoại không cho Lưu | "Liên kết phải bắt đầu bằng http:// hoặc https://" |
| Màn hình hẹp 375 px | Nhãn xếp trên ô nhập, modal cuộn bên trong, không cuộn ngang | None — bố cục co giãn |
| Phím Esc khi đang gửi | Bị bỏ qua cho tới khi gửi xong | None — silent handling |

## 10. Edge Behaviours to Verify

- **FR-101** → Bấm thanh ghi nhận mở modal Viết Kudo; hai pill còn lại vẫn mở "Coming soon"
- **FR-103** → Chỉ tài khoản không có hồ sơ Sunner (hiếm) mới thấy thanh ghi nhận vô hiệu; tài khoản Google mới thì không
- **FR-201** → Thứ tự trường trong modal đúng thiết kế
- **FR-203** → Gõ "  Nguyễn  " ra gợi ý như "Nguyễn"; không có chính người gửi trong danh sách
- **FR-204** → Gõ "@ # $" không gây lỗi, ra danh sách trống kèm "Không tìm thấy kết quả"
- **FR-206** → Danh hiệu trống báo lỗi, 100 ký tự nhận, 101 ký tự không nhận thêm
- **FR-207** → B, I, S, danh sách số, trích dẫn đều áp được lên chữ đã chọn
- **FR-208** → Nội dung trống hoặc chỉ khoảng trắng không gửi được
- **FR-210** → Hộp thoại liên kết kiểm Text và Link trước khi Lưu
- **FR-211** → Chọn người từ danh sách "@" chèn đúng tên vào nội dung
- **FR-213** → Đủ 5 hashtag thì chỉ gỡ bớt mới chọn được cái khác
- **FR-215** → pdf, mp4, txt bị từ chối với "Định dạng file không hợp lệ"
- **FR-216** → Đủ 5 ảnh thì "+ Image" ẩn; xóa một ảnh thì hiện lại
- **FR-217** → Mở modal, chọn ảnh rồi Hủy không để lại tệp nào trong kho ảnh
- **FR-218** → Bật ẩn danh hiện ô tên; tắt thì ô ẩn và giá trị mất
- **FR-219** → Nút Gửi mờ khi thiếu trường nhưng bấm vẫn hiện đủ lỗi và không gửi
- **FR-222** → Đang gửi thì không sửa được ô nào và không bấm được Hủy
- **FR-224** → Esc đóng modal, click nền mờ không làm gì
- **FR-401** → Kudo ẩn danh trên Live board chỉ có tên ẩn danh, không ảnh đại diện
- **FR-402** → Tim vào Kudo ẩn danh vẫn cộng cho người gửi thật
- **FR-403** → Gửi xong, Kudo mới nằm đầu All Kudos sau khi nạp lại
- **FR-602** → Không chọn được chính mình làm người nhận
- **FR-604** → Người khác không dò ra người gửi thật qua Live board, truy vấn trực tiếp hay địa chỉ ảnh
- **FR-605** → Nội dung chứa thẻ HTML chỉ hiện như chữ, liên kết mở tab mới

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Địa chỉ ảnh theo thư mục của người gửi có thể nối các Kudo của cùng một người và làm lộ danh tính của Kudo ẩn danh | Đã xử lý khi xây: tên ảnh trung lập `<uuid>.<ext>` ở gốc bucket, quyền sở hữu qua `owner_id` (D010 ở § 3; `supabase/migrations/20261015035942_write_kudo_columns_and_storage.sql:29-39`) | [INFERRED] |
| RISK-02 | risk | Máy chủ giả của E2E và SQL thật là hai bản cài của cùng luật kiểm dữ liệu, có thể lệch nhau | Test xanh nhưng luật thật khác; SQL là bản chuẩn | [EXPECTED] |
| RISK-03 | risk | Thư viện soạn thảo mới có thể chưa khớp Next 16 và React 19 | Phải đổi phiên bản hoặc cách tích hợp lúc dựng | [UNVERIFIED] |
| RISK-04 | risk | Không giới hạn tần suất gửi, một người có thể gửi hàng loạt Kudo | Làm loãng Live board | [EXPECTED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F006_KudosLiveBoard | feature | Thanh ghi nhận, danh sách All Kudos, dữ liệu Kudo, hashtag và hồ sơ Sunner đều đến từ đây | FR-101, FR-403 |
| F001_Auth | feature | Phiên đăng nhập quyết định ai được mở modal và ai là người gửi | FR-102, FR-601 |
| F002_Localization | feature | Từ điển vi/en cho mọi chuỗi mới | FR-226 |
| Kho ảnh của Supabase | infrastructure | Nơi lưu ảnh đính kèm; kho đối tượng đầu tiên của dự án | FR-002, FR-217 |
| Thư viện soạn thảo văn bản định dạng | infrastructure | Cung cấp định dạng, danh sách, liên kết và nhắc tên theo lược đồ ràng buộc | FR-207, FR-211 |
| Danh sách hashtag có sẵn (từ 6 hashtag trở lên trong dữ liệu mẫu) | data | Người dùng chỉ chọn trong danh sách này; đủ để kiểm giới hạn 5 | FR-212, FR-213 |
| Trang giữ chỗ `/standards` | feature | Đích của "Tiêu chuẩn cộng đồng" | FR-105 |

## 13. Configuration

```text
TITLE_MAX_LENGTH = 100              # danh hiệu dài tối đa 100 ký tự sau khi bỏ khoảng trắng
CONTENT_MAX_LENGTH = 2000           # chữ thuần của lời cảm ơn tối đa 2000 ký tự
HASHTAG_MIN = 1                     # cần ít nhất 1 hashtag
HASHTAG_MAX = 5                     # tối đa 5 hashtag
IMAGE_MAX_COUNT = 5                 # tối đa 5 ảnh
IMAGE_MAX_SIZE_MB = 5               # mỗi ảnh tối đa 5 MB
IMAGE_ALLOWED_TYPES = JPEG, PNG, WebP
ANONYMOUS_NAME_MAX_LENGTH = 50      # tên ẩn danh tối đa 50 ký tự
LINK_TEXT_MAX_LENGTH = 100          # phần chữ của liên kết 1 đến 100 ký tự
LINK_URL_LENGTH = 5 to 2048         # độ dài địa chỉ liên kết
RECIPIENT_SEARCH_MAX_RESULTS = 10   # số gợi ý tối đa cho người nhận và "@"
```
