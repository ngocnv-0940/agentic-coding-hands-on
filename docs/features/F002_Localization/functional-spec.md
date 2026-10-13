---
status: draft
authored_by: takumi
created: 2026-10-08
lang: vi
---

# Functional Spec — F002_Localization

**Priority**: P1
**Type**: ui

**See also:** [`technical-spec.md`](./technical-spec.md) — chi tiết cho Dev/QA/SA.

## 1. Overview

**Problem:** Khách truy cập màn Login cần đọc nội dung bằng tiếng Việt hoặc tiếng Anh trước khi đăng nhập; hiện chỉ có một ngôn ngữ cố định.
**Solution:** Bộ chọn VN/EN ở góc phải header. Chọn xong, giao diện đổi toàn bộ chuỗi sang ngôn ngữ đó và nhớ lựa chọn cho lần sau. Mặc định là tiếng Việt.
**Scope:** Bộ chọn (cờ + mã + mũi tên), menu hai ngôn ngữ, ghi nhớ lựa chọn, render mọi chuỗi (Login và `/todo`) từ từ điển vi/en tự viết, thuộc tính ngôn ngữ của trang.
**Non-Scope:** Thư viện i18n; URL có tiền tố ngôn ngữ; ngôn ngữ thứ ba; tự đoán ngôn ngữ từ trình duyệt; bộ chọn ở trang khác ngoài header Login; vỏ màn Login và đăng nhập (thuộc F001_Auth).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Khách truy cập | Người mở màn Login, chưa cần đăng nhập | Đọc giao diện bằng ngôn ngữ mình hiểu và được nhớ cho lần sau |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Localization | Chọn VN hoặc EN trên header, thấy toàn bộ chuỗi đổi ngôn ngữ và giữ nguyên ở các lần sau | US007_SelectLanguage, US008_KeepLanguage | FR-001, FR-002, FR-201, FR-202, FR-203, FR-401, FR-402, FR-403, FR-404, FR-405, FR-601 | BR-001, BR-002, DEC-001, DEC-002, SM-001 | SCR001_Login |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Cờ và nhãn của mục EN (cờ Anh, Mỹ hay biểu tượng khác); menu hiện mã (VN/EN) hay tên đầy đủ | **Đã chốt:** cờ Anh (UK), cùng kích thước cờ Việt Nam, kèm mã "EN"; menu hiện cờ + mã như nút (clarifications.md, 2026-10-08) | Specs chỉ mô tả cờ Việt Nam + "VN", không nói về EN | no |
| D002 | Thời hạn ghi nhớ lựa chọn ngôn ngữ | **Đã chốt:** cookie `max-age` 1 năm, `path=/`, `SameSite=Lax` (clarifications.md, 2026-10-08) | Lựa chọn hiển thị, không nhạy cảm; hết hạn sớm thì khách phải chọn lại | no |
| D003 | Chuỗi của trang `/todo` (nhãn email, nút Logout) có vào từ điển không | **Đã chốt:** có — từ điển gồm cả chuỗi `/todo` (nhãn email, Logout) cùng mọi chuỗi Login (tiêu đề, subtitle, tagline, nút, lỗi, footer, nhãn ngôn ngữ) (clarifications.md, 2026-10-08) | Một từ điển duy nhất; bộ chọn vẫn chỉ có ở header Login | no |
| D004 | Ai sở hữu file từ điển và bộ khóa chuỗi Login (F002 hay F001) | **Đã chốt:** một từ điển `lib/i18n` do F002 sở hữu; F001 chỉ dùng khóa, kể cả chuỗi lỗi đăng nhập (clarifications.md, 2026-10-08) | Một nơi giữ từ điển, tránh hai feature cùng sửa | no |
| D005 | Có hỗ trợ phím mũi tên trong menu không | **Đã chốt:** không có listbox phím mũi tên; Enter/Space mở đóng menu, Escape và bấm ngoài thì đóng, Tab tới các mục (clarifications.md, 2026-10-08) | Menu hai mục; giữ đơn giản | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mọi chuỗi giao diện thuộc phạm vi lấy từ từ điển vi/en tự viết, không dùng thư viện i18n.
- **FR-002** Chưa chọn lần nào, hoặc giá trị đã lưu không hợp lệ, thì giao diện dùng tiếng Việt.

### Language Selector — header Login (2xx)

- **FR-201** Bộ chọn nằm góc phải header ở mọi cỡ cửa sổ, hiện cờ + mã ngôn ngữ + mũi tên xuống; mặc định cờ Việt Nam + "VN".
- **FR-202** Bấm bộ chọn mở menu hai lựa chọn VN và EN; rê chuột lên thì con trỏ thành pointer và bộ chọn được tô sáng.
- **FR-203** Menu mở đóng lại khi bấm lại bộ chọn, nhấn Escape, hoặc bấm ra ngoài.

### Interaction (4xx)

- **FR-401** Chọn ngôn ngữ khác ngôn ngữ đang dùng thì lưu lựa chọn (`vi` hoặc `en`) vào cookie `NEXT_LOCALE`.
- **FR-402** Sau khi chọn, trang render lại và mọi chuỗi từ từ điển đổi sang ngôn ngữ mới, nhãn bộ chọn đổi theo, menu đóng.
- **FR-403** Lựa chọn giữ qua các lần tải lại và các lần mở trang sau.
- **FR-404** Thuộc tính ngôn ngữ của trang luôn khớp ngôn ngữ đang dùng (`vi` hoặc `en`).
- **FR-405** Chọn đúng ngôn ngữ đang dùng thì chỉ đóng menu, không đổi gì.

### Security (6xx)

- **FR-601** Chọn ngôn ngữ không cần đăng nhập và không ảnh hưởng phiên đăng nhập.

## 5. Business Rules

- Chỉ `vi` hoặc `en` hợp lệ; thiếu hoặc giá trị lạ đều quy về `vi`, không báo lỗi (BR-001)
- Mỗi chuỗi trong từ điển phải có đủ bản vi và en; thiếu khóa ở một ngôn ngữ là lỗi, không phải hiển thị trống (BR-002)
- Nhãn bộ chọn theo ngôn ngữ đang dùng: vi là cờ Việt Nam + "VN", en là cờ + "EN" (cờ EN là cờ Anh, D001) (DEC-001)
- Chọn ngôn ngữ khác thì lưu và render lại; chọn đúng cái đang dùng thì chỉ đóng menu (DEC-002)
- Menu bộ chọn có hai trạng thái, đóng và mở, chỉ tồn tại ở trình duyệt, không lưu lại (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Login, vùng bộ chọn ngôn ngữ trên header (mục 1.2 Language Selector; vỏ màn do F001_Auth đặc tả tại `docs/screens/SCR001_Login/`) | SCR001_Login (không khai báo REG###; vỏ màn do F001_Auth sở hữu) | Cờ + "VN" + mũi tên ở góc phải header; khi mở: menu VN / EN | Mở và đóng menu (bấm hoặc Enter/Space, Escape, bấm ngoài); chọn VN hoặc EN |

### User Journey

1. Khách mở màn Login lần đầu, thấy giao diện tiếng Việt và bộ chọn "VN" ở góc phải header.
2. Khách bấm bộ chọn — menu VN / EN mở ra, mục được rê chuột có tô sáng.
3. Khách chọn EN — menu đóng, toàn bộ chữ trên màn chuyển sang tiếng Anh, bộ chọn hiện "EN".
4. Khách tải lại hoặc quay lại sau — vẫn thấy tiếng Anh.
5. Nếu khách đổi ý: Escape hoặc bấm ra ngoài thì đóng menu mà không đổi gì; chọn VN thì quay lại tiếng Việt.

## 7. User Stories

### US007_SelectLanguage — Chọn ngôn ngữ giao diện

**Actor:** Khách truy cập
**Goal:** Đổi giao diện Login giữa tiếng Việt và tiếng Anh ngay trên header.
**Business value:** Khách đọc hiểu nội dung trước khi đăng nhập nên ít bỏ dở màn Login.

**Acceptance Criteria:**
- [ ] Bộ chọn ở góc phải header, hiện cờ + mã + mũi tên; mặc định "VN"
- [ ] Bấm mở menu VN / EN; bấm lại, Escape, hoặc bấm ra ngoài thì đóng
- [ ] Chọn EN thì mọi chuỗi từ từ điển chuyển tiếng Anh và nhãn bộ chọn đổi theo
- [ ] Chọn đúng ngôn ngữ đang dùng thì chỉ đóng menu

### US008_KeepLanguage — Giữ ngôn ngữ đã chọn

**Actor:** Khách truy cập
**Goal:** Mở lại Login và thấy đúng ngôn ngữ đã chọn mà không phải chọn lại; lần đầu thì thấy tiếng Việt.
**Business value:** Không bắt khách lặp lại thao tác, giữ trải nghiệm nhất quán giữa các lần ghé.

**Acceptance Criteria:**
- [ ] Sau khi chọn, tải lại hoặc mở lại trang vẫn ra ngôn ngữ đó
- [ ] Chưa chọn lần nào hoặc giá trị lưu bị hỏng thì ra tiếng Việt, không lỗi
- [ ] Thuộc tính ngôn ngữ của trang khớp ngôn ngữ đang hiển thị

## 8. Scenarios

### US007_SelectLanguage — Happy Path

**Given** Login đang tiếng Việt, **When** khách bấm bộ chọn rồi chọn EN, **Then** menu đóng, mọi chuỗi chuyển tiếng Anh và bộ chọn hiện "EN".

### US007_SelectLanguage — Error: trình duyệt chặn cookie

**Given** trình duyệt không cho lưu cookie, **When** khách chọn EN, **Then** lựa chọn không được nhớ và trang vẫn hiện ngôn ngữ cũ; không có thông báo lỗi.

### US008_KeepLanguage — Happy Path

**Given** khách đã chọn EN ở lần trước, **When** khách mở lại Login, **Then** trang hiện tiếng Anh và bộ chọn hiện "EN".

### US008_KeepLanguage — Error: giá trị đã lưu không hợp lệ

**Given** giá trị ngôn ngữ đã lưu bị hỏng hoặc lạ, **When** khách mở Login, **Then** trang hiện tiếng Việt và bộ chọn hiện "VN", không báo lỗi.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Giá trị ngôn ngữ đã lưu lạ hoặc sai chữ hoa | Quy về tiếng Việt | "None — silent handling" |
| Chọn VN rồi EN thật nhanh | Lần chọn cuối thắng | "None — silent handling" |
| Hai tab, đổi ngôn ngữ ở một tab | Tab kia giữ chữ cũ cho tới khi điều hướng hoặc tải lại | "None — silent handling" |
| Menu đang mở, nhấn Escape hoặc bấm ra ngoài | Menu đóng, ngôn ngữ giữ nguyên | "None — silent handling" |
| Chọn đúng ngôn ngữ đang dùng | Chỉ đóng menu | "None — silent handling" |
| Cửa sổ rất hẹp | Bộ chọn vẫn ở góc phải header | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-001** → Thêm một chuỗi ở một ngôn ngữ mà quên ngôn ngữ kia thì dự án không qua bước kiểm kiểu
- **FR-002** → Xóa cookie rồi mở Login: ra tiếng Việt, bộ chọn "VN"
- **FR-201** → Bộ chọn nằm góc phải header với cờ Việt Nam, "VN" và mũi tên xuống, ở mọi cỡ cửa sổ
- **FR-202** → Bấm mở menu hai mục; rê chuột thấy tô sáng và con trỏ pointer
- **FR-203** → Menu mở đóng được bằng bấm lại, Escape, và bấm ra ngoài
- **FR-401** → Chọn EN thì cookie `NEXT_LOCALE` có giá trị `en`; chọn VN thì `vi`
- **FR-402** → Sau khi chọn EN, tiêu đề, mô tả, nút đăng nhập và chân trang đều ra tiếng Anh, không còn chữ Việt từ từ điển
- **FR-403** → Tải lại và mở tab mới vẫn giữ ngôn ngữ đã chọn
- **FR-404** → Thuộc tính ngôn ngữ của trang là `vi` hoặc `en` khớp với chữ đang hiển thị
- **FR-405** → Chọn đúng ngôn ngữ đang dùng: menu đóng, không có gì đổi
- **FR-601** → Đổi ngôn ngữ khi chưa đăng nhập vẫn chạy; không có yêu cầu đăng nhập

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Hai feature (F001_Auth, F002_Localization) cùng chạm layout gốc và từ điển; dễ xung đột khi implement (xem D004) | Chậm tiến độ, chuỗi lỗi đăng nhập có thể sót bản dịch | [INFERRED] |
| RISK-02 | risk | Cơ chế render lại sau khi ghi cookie chưa kiểm trên Next đã cài | Chọn xong mà giao diện không đổi ngay | [UNVERIFIED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Sở hữu vỏ màn Login và header chứa bộ chọn; dùng từ điển để hiện chuỗi và thông báo lỗi | FR-201, D004 |
| Trình duyệt cho phép cookie | infrastructure | Nhớ lựa chọn ngôn ngữ | FR-403, US008_KeepLanguage |
| Next.js render phía server | infrastructure | Render lại chuỗi theo ngôn ngữ đã chọn | FR-402 |

## 13. Configuration

```text
SUPPORTED_LOCALES = vi, en          # hai ngôn ngữ giao diện được hỗ trợ
DEFAULT_LOCALE = vi                 # ngôn ngữ khi chưa chọn hoặc giá trị lạ (nhãn "VN")
LOCALE_COOKIE_NAME = NEXT_LOCALE    # nơi lưu lựa chọn của khách
LOCALE_COOKIE_MAX_AGE = 31536000    # 1 năm (D002, đã chốt)
```
