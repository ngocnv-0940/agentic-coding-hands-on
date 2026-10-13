---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

**Priority**: P0
**Type**: ui

## 1. Overview

**Problem:** Ứng dụng SAA 2025 chưa có cách nào xác định người dùng là ai trước khi cho vào; cần một cổng đăng nhập bằng tài khoản Google, giữ phiên đăng nhập, chặn trang nội bộ với khách và cho phép đăng xuất.
**Solution:** Khách bấm "LOGIN With Google" trên màn Login, đăng nhập Google ngay trong cùng tab rồi vào trang `/todo`. Trang `/todo` chỉ người đã đăng nhập mới xem được; nó hiện email và nút Logout. Đăng nhập lỗi hoặc bị huỷ thì quay lại màn Login kèm thông báo lỗi ngay dưới nút.
**Scope:** Màn Login (vỏ màn: hero, khối giới thiệu, nút đăng nhập, thông báo lỗi, footer, logo ở header); bước đổi mã đăng nhập lấy phiên sau khi Google trả về; chặn/chuyển hướng theo trạng thái đăng nhập; trang `/todo` tối thiểu (email + Logout); đăng xuất.
**Non-Scope:** Bộ chọn ngôn ngữ VN/EN, cookie `NEXT_LOCALE` và từ điển vi/en thuộc F002_Localization (màn Login chỉ nhận chuỗi từ từ điển đó). Không giới hạn tên miền Google, không đăng nhập bằng email/mật khẩu, không phân quyền theo vai trò, không có chức năng todo thật, không bảng dữ liệu riêng của ứng dụng.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Khách | Người chưa đăng nhập, mở màn Login | Đăng nhập bằng tài khoản Google để vào ứng dụng |
| Người dùng đã đăng nhập | Người đã có phiên hợp lệ | Xem trang `/todo` và đăng xuất khi xong |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Đăng nhập bằng Google | Khách mở màn Login, bấm nút, đăng nhập Google rồi vào `/todo`; thất bại hoặc huỷ thì thấy thông báo lỗi và thử lại | US001, US002 | FR-001, FR-002, FR-103, FR-201, FR-202, FR-203, FR-204, FR-205, FR-401, FR-402, FR-403 | BR-001, BR-002, DEC-002, DEC-003, SM-001 | TBD (draft) |
| CAP-02 | Bảo vệ trang theo phiên | Khách không vào được `/todo`; người đã đăng nhập không phải xem lại màn Login | US005, US006 | FR-101, FR-102, FR-601 | BR-003, BR-004, DEC-001 | TBD (draft) |
| CAP-03 | Xem trang cá nhân và đăng xuất | Người đã đăng nhập thấy email của mình trên `/todo` và đăng xuất về màn Login | US003, US004 | FR-104, FR-301, FR-404 | — | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Bố cục màn Login trên màn hình nhỏ (di động/máy tính bảng) chưa có thiết kế | **Đã chốt:** responsive cơ bản — giữ bố cục desktop; dưới breakpoint `md` thu nhỏ cỡ chữ và padding, logo vẫn bên trái, bộ chọn ngôn ngữ bên phải, không cuộn ngang (clarifications.md, 2026-10-08) | Test case chỉ yêu cầu header/footer giữ vị trí khi đổi cỡ cửa sổ | no |
| D002 | Chuỗi của trang `/todo` (nhãn nút Logout) có đi qua từ điển vi/en của F002 không | **Đã chốt:** có — từ điển `lib/i18n` do F002 sở hữu gồm cả chuỗi `/todo` (nhãn email, Logout); nhãn vi "Đăng xuất", en "Logout" (clarifications.md, 2026-10-08) | Nút tiếng Anh trên giao diện tiếng Việt gây lệch; chi phí thêm khoá rất nhỏ | no |
| D003 | Bản tiếng Anh của tiêu đề, subtitle, tagline, thông báo lỗi và footer (thiết kế chỉ có bản tiếng Việt) | **Đã chốt:** bản en do nhóm tự soạn trong từ điển (sửa sau được); "ROOT FURTHER" và "LOGIN With Google" giữ nguyên ở cả vi và en (clarifications.md, 2026-10-08) | Thiết kế không cung cấp bản en; F002 sở hữu từ điển | no |
| D004 | Đăng xuất chỉ kết thúc phiên trên thiết bị này hay trên mọi thiết bị | **Đã chốt:** chỉ thiết bị hiện tại — `signOut({ scope: 'local' })` (clarifications.md, 2026-10-08) | Đơn giản nhất, đủ cho trang `/todo` tối thiểu | no |
| D005 | Cách kiểm tra phiên khi chặn trang: xác minh bằng máy chủ xác thực hay chỉ xác minh chữ ký token cục bộ | **Đã chốt:** proxy dùng `getUser()`; `/todo` và logout kiểm lại bằng `getUser()` phía server (thu hồi phiên có hiệu lực ngay, mock E2E không cần JWKS) (clarifications.md, 2026-10-08) | Cục bộ nhanh hơn nhưng không phát hiện phiên đã bị thu hồi | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Dự án Supabase cục bộ phải bật sẵn nhà cung cấp Google bằng cấu hình đã commit, khoá bí mật lấy từ biến môi trường ngoài git.
- **FR-002** Mọi tài khoản Google đều đăng nhập được, không giới hạn tên miền.

### Navigation (1xx)

- **FR-101** Khách chưa đăng nhập mở `/todo` thì bị chuyển về `/login`.
- **FR-102** Người đã đăng nhập mở `/login` thì bị chuyển sang `/todo`.
- **FR-103** Đăng nhập thành công luôn đưa người dùng tới `/todo`.
- **FR-104** Đăng xuất xong đưa người dùng về `/login`.

### Login (2xx)

- **FR-201** Màn Login hiển thị header (logo trái, vùng chọn ngôn ngữ phải), hình hero nền, tiêu đề "ROOT FURTHER", subtitle, tagline, nút "LOGIN With Google" và footer bản quyền.
- **FR-202** Header và footer cố định khi cuộn; logo, hero, các dòng giới thiệu và footer không tương tác được.
- **FR-203** Nút đăng nhập nổi bóng khi rê chuột; sau khi bấm thì bị vô hiệu hoá và hiện chỉ báo đang tải.
- **FR-204** Khi đăng nhập thất bại hoặc bị huỷ, thông báo lỗi hiện ngay dưới nút đăng nhập.
- **FR-205** Mọi chuỗi trên màn Login lấy từ từ điển theo ngôn ngữ đang chọn (từ điển `lib/i18n` do F002_Localization sở hữu; F001 chỉ dùng khóa).

### Todo (3xx)

- **FR-301** Trang `/todo` hiện email của người dùng đang đăng nhập và nút Logout.

### Interaction (4xx)

- **FR-401** Bấm nút đăng nhập chuyển hướng ngay trong cùng tab sang Google, không mở tab hay cửa sổ mới.
- **FR-402** Sau khi Google trả về, hệ thống đổi mã đăng nhập lấy phiên; thành công vào `/todo`, lỗi/huỷ/thiếu mã thì về `/login` kèm cờ lỗi.
- **FR-403** Nếu không khởi động được luồng đăng nhập ngay trên màn Login, nút bật lại và thông báo lỗi hiện ra.
- **FR-404** Đăng xuất xoá phiên của người dùng.

### Security (6xx)

- **FR-601** Quyết định cho vào hay chặn trang dựa trên phiên được xác minh phía máy chủ, không tin dữ liệu cookie chưa xác minh; trang `/todo` kiểm tra lại phiên của chính nó.

## 5. Business Rules

- Mọi cờ lỗi khác rỗng đều hiện đúng một thông báo cố định "Đăng nhập không thành công. Vui lòng thử lại.", không bao giờ in lại nội dung của cờ. (BR-001)
- Sau đăng nhập luôn tới `/todo`; hệ thống không nhận đích chuyển hướng từ bên ngoài. (BR-002)
- Các đường dẫn trao đổi đăng nhập không bị áp quy tắc chuyển hướng theo phiên, để bước đổi mã không bị chặn. (BR-003)
- Mỗi lần chuyển hướng theo phiên phải giữ nguyên cookie phiên vừa được làm mới, nếu không người dùng bị đăng xuất ngầm. (BR-004)
- Khách vào trang cần phiên thì về màn Login; người có phiên vào màn Login thì sang `/todo` (kể cả khi có cờ lỗi). (DEC-001)
- Kết quả bước đổi mã: có cờ lỗi từ Google, hoặc thiếu mã, hoặc đổi mã lỗi thì về màn Login kèm lỗi; còn lại vào `/todo`. (DEC-002)
- Thông báo lỗi chỉ hiện khi có cờ lỗi trên địa chỉ màn Login; không có cờ thì không hiện gì. (DEC-003)
- Nút đăng nhập đi qua ba trạng thái: sẵn sàng, đang khởi động (vô hiệu hoá + chỉ báo tải), lỗi (bật lại + thông báo). (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Login (bản nháp: SCR-login) | TBD (draft) | Header cố định với logo và vùng chọn ngôn ngữ, hình hero sóng màu, tiêu đề "ROOT FURTHER", dòng "Bắt đầu hành trình của bạn cùng SAA 2025.", dòng "Đăng nhập để khám phá!", nút "LOGIN With Google", thông báo lỗi khi có, footer bản quyền | Bấm nút đăng nhập; mở bộ chọn ngôn ngữ (hành vi do F002_Localization quy định) |
| Todo (bản nháp: SCR-todo) | TBD (draft) | Email người dùng đang đăng nhập và nút Logout | Đăng xuất |

### User Journey

1. Khách mở ứng dụng, thấy màn Login với hình hero, lời giới thiệu và nút "LOGIN With Google".
2. Khách bấm nút — nút bị vô hiệu hoá và hiện chỉ báo tải, trình duyệt chuyển sang trang đăng nhập Google ngay trong tab đó.
3. Khách chọn tài khoản Google và đồng ý; trình duyệt quay lại ứng dụng, phiên được tạo và khách thấy màn Todo với email của mình.
4. Nếu khách huỷ hoặc đăng nhập lỗi, khách quay lại màn Login và thấy dòng "Đăng nhập không thành công. Vui lòng thử lại." dưới nút, rồi bấm lại.
5. Người dùng bấm Logout trên màn Todo và trở về màn Login.

## 7. User Stories

### US001_Login — Đăng nhập bằng Google

**Actor:** Khách
**Goal:** Đăng nhập bằng tài khoản Google của mình để vào ứng dụng.
**Business value:** Xác định được người dùng mà không cần tạo mật khẩu riêng; mọi tài khoản Google đều dùng được.

**Acceptance Criteria:**
- [ ] Bấm nút chuyển sang trang đăng nhập Google trong cùng tab.
- [ ] Trong lúc chờ, nút bị vô hiệu hoá và có chỉ báo tải.
- [ ] Đăng nhập xong người dùng ở màn Todo và thấy email của mình.

### US002_LoginFailure — Thấy lỗi khi đăng nhập thất bại hoặc bị huỷ

**Actor:** Khách
**Goal:** Biết đăng nhập chưa thành công và thử lại ngay.
**Business value:** Người dùng không bị kẹt ở màn trắng hay trạng thái tải vô tận khi Google từ chối hoặc họ đổi ý.

**Acceptance Criteria:**
- [ ] Sau khi huỷ hoặc lỗi, màn Login hiện đúng một thông báo lỗi dưới nút.
- [ ] Nút đăng nhập dùng lại được.

### US003_ViewTodo — Xem trang Todo

**Actor:** Người dùng đã đăng nhập
**Goal:** Thấy mình đang đăng nhập bằng tài khoản nào.
**Business value:** Xác nhận đăng nhập đúng tài khoản, tránh nhầm khi dùng nhiều tài khoản Google.

**Acceptance Criteria:**
- [ ] Trang hiện email của tài khoản đang đăng nhập và nút Logout.

### US004_Logout — Đăng xuất

**Actor:** Người dùng đã đăng nhập
**Goal:** Kết thúc phiên đăng nhập trên thiết bị này.
**Business value:** Bảo vệ tài khoản trên máy dùng chung.

**Acceptance Criteria:**
- [ ] Bấm Logout đưa người dùng về màn Login.
- [ ] Sau đó mở lại trang Todo thì bị chuyển về màn Login.

### US005_GuardTodo — Khách bị chặn khỏi trang Todo

**Actor:** Khách
**Goal:** (Hệ thống bảo vệ) Khách không xem được nội dung dành cho người đã đăng nhập.
**Business value:** Dữ liệu và trang nội bộ chỉ dành cho người đã xác thực.

**Acceptance Criteria:**
- [ ] Mở `/todo` khi chưa đăng nhập thì thấy màn Login.

### US006_SkipLogin — Người đã đăng nhập bỏ qua màn Login

**Actor:** Người dùng đã đăng nhập
**Goal:** Không phải đăng nhập lại khi phiên còn hiệu lực.
**Business value:** Tránh bước thừa và tránh tạo phiên chồng nhau.

**Acceptance Criteria:**
- [ ] Mở `/login` khi đã đăng nhập thì thấy màn Todo.

## 8. Scenarios

### US001_Login — Happy Path

**Given** khách ở màn Login, **When** khách bấm "LOGIN With Google" và đồng ý trên trang Google, **Then** khách ở màn Todo và thấy email của mình.

### US001_Login — Error: tài khoản chưa chọn xong mà đóng trang

**Given** khách đã bấm nút và đang ở trang Google, **When** khách đóng tab rồi mở lại màn Login, **Then** nút ở trạng thái sẵn sàng, không có thông báo lỗi.

### US002_LoginFailure — Happy Path

**Given** khách đang ở trang đồng ý của Google, **When** khách bấm huỷ, **Then** khách quay lại màn Login và thấy "Đăng nhập không thành công. Vui lòng thử lại." dưới nút.

### US002_LoginFailure — Error: không khởi động được luồng đăng nhập

**Given** trình duyệt mất kết nối ngay lúc bấm nút, **When** việc chuyển sang Google không thực hiện được, **Then** nút bật lại và cùng thông báo lỗi hiện ra.

### US003_ViewTodo — Happy Path

**Given** người dùng đã đăng nhập, **When** mở `/todo`, **Then** thấy email của mình và nút Logout.

### US003_ViewTodo — Error: phiên hết hạn

**Given** phiên đã hết hạn và không làm mới được, **When** người dùng mở `/todo`, **Then** bị chuyển về màn Login.

### US004_Logout — Happy Path

**Given** người dùng ở màn Todo, **When** bấm Logout, **Then** về màn Login và phiên bị xoá.

### US004_Logout — Error: phiên đã hết hạn trước khi bấm

**Given** phiên đã mất hiệu lực nhưng trang còn mở, **When** người dùng bấm Logout, **Then** vẫn về màn Login và không hiện lỗi.

### US005_GuardTodo — Happy Path

**Given** khách chưa đăng nhập, **When** gõ địa chỉ `/todo`, **Then** thấy màn Login.

### US005_GuardTodo — Error: cookie phiên bị sửa hoặc giả

**Given** trình duyệt mang cookie phiên không hợp lệ, **When** mở `/todo`, **Then** bị chuyển về màn Login như khách.

### US006_SkipLogin — Happy Path

**Given** người dùng đã đăng nhập, **When** gõ địa chỉ `/login`, **Then** thấy màn Todo.

### US006_SkipLogin — Error: người đã đăng nhập mở màn Login kèm cờ lỗi

**Given** người dùng đã đăng nhập, **When** mở `/login` có cờ lỗi, **Then** vẫn sang `/todo` và không hiện thông báo lỗi.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Cờ lỗi chứa nội dung tuỳ ý (ví dụ chữ giả mạo hoặc mã HTML) | Chỉ có thông báo cố định được hiện; nội dung cờ bị bỏ qua | "Đăng nhập không thành công. Vui lòng thử lại." |
| Khách bấm nút liên tiếp nhiều lần | Nút bị vô hiệu hoá sau lần bấm đầu nên chỉ một luồng đăng nhập chạy | None — silent handling |
| Google trả về không kèm mã đăng nhập cũng không kèm lỗi | Coi như thất bại, về màn Login | "Đăng nhập không thành công. Vui lòng thử lại." |
| Đổi mã thất bại (mã đã dùng, hết hạn, hoặc mở ứng dụng bằng địa chỉ khác với lúc bấm nút) | Không tạo phiên, về màn Login kèm lỗi | "Đăng nhập không thành công. Vui lòng thử lại." |
| Khách huỷ ở trang Google | Về màn Login kèm lỗi, nút dùng lại được | "Đăng nhập không thành công. Vui lòng thử lại." |
| Phiên sắp hết hạn khi chuyển hướng | Phiên được làm mới và cookie mới đi kèm lần chuyển hướng | None — silent handling |
| Người đã đăng nhập mở `/login` hoặc quay lại bằng nút Back | Chuyển sang `/todo` | None — silent handling |
| Khách mở `/todo` bằng đường dẫn con hoặc có tham số | Vẫn bị chuyển về `/login` | None — silent handling |
| Tài khoản Google không có email hiển thị | Trang Todo hiện dấu gạch ở chỗ email | "—" |

## 10. Edge Behaviours to Verify

- **FR-001** → Sau khi khởi động Supabase cục bộ bằng cấu hình đã commit, nút đăng nhập dẫn tới trang đồng ý của Google (không báo nhà cung cấp chưa bật).
- **FR-002** → Hai tài khoản Google khác tên miền đều đăng nhập được.
- **FR-101** → `/todo` và `/todo/bất-kỳ` khi chưa đăng nhập đều dẫn về `/login`.
- **FR-102** → `/login` khi đã đăng nhập dẫn sang `/todo`, kể cả có cờ lỗi.
- **FR-103** → Đăng nhập thành công luôn kết thúc ở `/todo`.
- **FR-104** → Logout xong địa chỉ là `/login`.
- **FR-201** → Đủ logo, vùng ngôn ngữ, hero, "ROOT FURTHER", hai dòng giới thiệu, nút và footer; logo ở góc trái trên, vùng ngôn ngữ ở góc phải trên.
- **FR-202** → Cuộn trang, header và footer đứng yên; bấm hoặc rê lên logo, dòng giới thiệu, footer không có phản ứng.
- **FR-203** → Rê chuột lên nút có bóng; bấm xong nút bị vô hiệu hoá và có chỉ báo tải trước khi trình duyệt rời trang.
- **FR-204** → Mở `/login` có cờ lỗi thì hiện đúng một thông báo dưới nút; mở không có cờ thì không hiện.
- **FR-205** → Đổi VN/EN (F002) thì chuỗi trên màn Login đổi theo, không còn chuỗi cứng sót lại.
- **FR-301** → `/todo` hiện đúng email của tài khoản vừa đăng nhập và có nút Logout.
- **FR-401** → Bấm nút không mở tab hay popup mới; trình duyệt rời trang trong cùng tab.
- **FR-402** → Huỷ ở Google, thiếu mã, mã sai đều về `/login` kèm lỗi; mã đúng về `/todo`.
- **FR-403** → Chặn mạng ngay khi bấm: nút bật lại và có thông báo lỗi.
- **FR-404** → Sau Logout, dùng nút Back hoặc mở lại `/todo` vẫn bị chuyển về `/login`.
- **FR-601** → Cookie phiên bị sửa tay không mở được `/todo`.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Chưa xác nhận bằng tài liệu chính thức tên tham số lỗi khi người dùng huỷ ở Google; thiết kế dựa trên hành vi chung của dịch vụ xác thực | Nhánh "huỷ" có thể rơi vào nhánh "thiếu mã"; kết quả cho người dùng vẫn như nhau nhưng test cần kiểm chứng | [UNVERIFIED] |
| RISK-02 | risk | Thư viện nối Supabase với Next.js còn ở phiên bản 0.x, có thể đổi giao diện giữa các bản nhỏ | Nâng cấp có thể làm vỡ luồng đăng nhập | [INFERRED] |
| RISK-03 | risk | Mở ứng dụng bằng địa chỉ khác với địa chỉ lúc bấm nút (ví dụ `localhost` và `127.0.0.1`) làm mất khoá xác thực tạm của trình duyệt | Đăng nhập lỗi khó hiểu khi phát triển cục bộ | [EXPECTED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| Supabase Auth (chạy cục bộ qua Supabase CLI + Docker) | external-service | Quản lý phiên và đổi mã đăng nhập | FR-001, FR-402 |
| Google OAuth | external-service | Nhà cung cấp danh tính duy nhất | FR-002, FR-401 |
| F002_Localization | feature | Cung cấp từ điển vi/en, ngôn ngữ đang chọn và vùng chọn ngôn ngữ trên header | FR-205 |
| Thiết kế MoMorph màn Login (GzbNeVGJHz) | data | Nguồn bố cục và nội dung chữ bản tiếng Việt | FR-201 |

## 13. Configuration

N/A — no user-facing configuration constants for this feature.
