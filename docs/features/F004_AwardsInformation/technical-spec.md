---
status: implemented
authored_by: takumi
fcode: F004
created: 2026-10-13
lang: vi
---

# F004_AwardsInformation

## 1. Technical Overview

Trang `/awards-information` thay trang giữ chỗ "Coming soon" ngay tại route hiện có trong nhóm `app/(main)`, nên header, footer, vỏ đăng nhập (proxy cộng layout) và ngôn ngữ đều dùng lại, không đổi. Trang chính là server component dựng hero, tiêu đề, 6 thẻ giải thưởng và khối Sun* Kudos từ danh sách 6 hạng mục dùng chung với trang chủ; chỉ menu hạng mục là thành phần client vì phải theo dõi cuộn, xử lý `#hash` và cuộn mượt. Không có bảng dữ liệu, API hay biến cấu hình mới; chuỗi mới thêm vào từ điển vi/en hiện có.

```mermaid
flowchart LR
    subgraph CAP01["CAP-01 Xem hệ thống giải"]
        A1["A1 Trang /awards-information"]
    end
    subgraph CAP02["CAP-02 Điều hướng hạng mục"]
        A2["A2 Bấm menu"]
        A3["A3 Scroll-spy"]
        A4["A4 Hash đường dẫn"]
    end
    subgraph CAP03["CAP-03 Sun* Kudos"]
        A5["A5 Nút Chi tiết"]
    end
    Guest(["Khách"]) --> G["Guard hiện có (A0)"]
    User(["Người dùng"]) --> A1
    A1 --> A2
    A1 --> A3
    A1 --> A4
    A1 --> A5
    HP(["Thẻ trang chủ"]) --> A4
    A5 --> SK["/sun-kudos"]
```

## 2. Action Index

| # | Action (handler) | Method · Path | Codes | Writes | Detail |
|---|---|---|---|---|---|
| **A0** | *cross-cutting — belongs to no single action* | — | FR-001, FR-601, BR-003 | — | § 4.4 |
| **A1** | `AwardsInformationPage` | `GET` `/awards-information` | FR-002, FR-101, FR-102, FR-201, FR-202, FR-203, FR-205, FR-406, FR-407, FR-601, BR-001, DEC-002, US001, US005 | — *(read-only)* | § 3.1 |
| **A2** | `useAwardCategorySpy#select` | browser · click | FR-401, FR-402, BR-002, DEC-001, US002 | — *(read-only)* | § 3.2 |
| **A3** | `useAwardCategorySpy` (scroll listener, `pickSlugInView`) | browser · scroll | FR-403, BR-002, DEC-001, ALG-001, US002 | — *(read-only)* | § 3.2 |
| **A4** | `useAwardCategorySpy` (`applyHash`, `parseAwardHash`) | browser · tải trang và `hashchange` | FR-404, FR-405, BR-002, DEC-001, US003 | — *(read-only)* | § 3.2 |
| **A5** | `KudosPromo` *(dùng lại của F003_Homepage)* | browser · điều hướng | FR-204, FR-408, US004 | — *(read-only)* | § 3.3 |

## 3. Actions

### 3.1 CAP-01 — Xem hệ thống giải thưởng

#### A1 · Hiển thị trang Hệ thống giải
`GET /awards-information` → `` `AwardsInformationPage` ``
`FR-002` `FR-101` `FR-102` `FR-201` `FR-202` `FR-203` `FR-205` `FR-406` `FR-407` `FR-601` `BR-001` `DEC-002` `US001` `US005` · `SCR004_AwardsInformation` (mã SCR### cấp lúc promote)

**Who** · Người dùng đã đăng nhập; khách chỉ bị chặn trước khi tới đây *(gate A0 — § 4.4)*
**FE** · Trang dựng theo thứ tự: hero keyvisual và tiêu đề (FR-201), menu hạng mục bên trái (FR-202), 6 thẻ giải thưởng ở giữa (FR-203), khối Sun* Kudos ở dưới (FR-205), cùng header và footer của layout `(main)`. Mỗi thẻ là một `<section>` có `id` bằng slug (FR-002). Mục "Awards Information" trên header tự sáng theo đường dẫn hiện tại (FR-102, hành vi sẵn có). Bố cục và phần tử chi tiết: `SCR004_AwardsInformation/spec.md`.
**Request** · không có tham số; cookie phiên và `NEXT_LOCALE`
**BE** · Server component đọc ngôn ngữ, lấy từ điển, rồi `buildAwardsInformationProps` ghép danh sách 6 hạng mục dùng chung (`AWARD_CATEGORIES`: slug, ảnh, khoá tiêu đề) với `AWARD_DETAILS` (khoá mô tả, số lượng, giá trị giải; mô tả đầy đủ nguyên văn Figma trong `dictionary-awards-*.ts`). Trang bọc phần đọc cookie ngôn ngữ trong `<Suspense>` và gọi `connection()` như layout `(main)`. Không gọi dịch vụ ngoài.
**Rule** · **BR-001 — Thứ tự và slug của 6 hạng mục lấy từ một danh sách duy nhất dùng chung với trang chủ.** Slug là `id` của phần tương ứng nên liên kết thẻ ở trang chủ vẫn đúng. Danh sách có sẵn ở `lib/awards/award-categories.ts` (`AWARD_SLUGS`, `AWARD_CATEGORIES`, `awardHref`).
```text
sections = AWARD_CATEGORIES in order        # same order for cards and menu items
section.id = category.slug                  # homepage links /awards-information#<slug> keep working
```

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-002** | render | chiều rộng cửa sổ từ 1024px trở lên | Menu dọc bên trái, dính ngay dưới header cố định khi 6 thẻ cuộn qua (FR-406) | `awards-category-menu.tsx:28` (`lg:top-24 lg:w-[178px]`), `awards-information-screen.tsx:22-26` |
| **DEC-002** | render | chiều rộng cửa sổ dưới 1024px | Menu thành một hàng tab cuộn ngang, ghim phía trên các thẻ, cùng kiểu active (FR-407) | `awards-category-menu.tsx:28` (`sticky top-20 overflow-x-auto`), `use-keep-active-tab-in-view.ts:12-23` |

**Result** · read-only. Người dùng thấy toàn bộ hệ thống giải theo ngôn ngữ đã chọn (US001). Khách mở trang này bị chặn bởi guard sẵn có và về `/login` (FR-601, US005); route vẫn thuộc nhóm bảo vệ của F003_Homepage, không đổi gì. Bố cục thẻ: dưới 768px xếp dọc; từ 768px ảnh và nội dung nằm ngang, thẻ chẵn ảnh bên trái, thẻ lẻ ảnh bên phải (D009).
**Source:** `app/(main)/awards-information/page.tsx:12-33`, `app/(main)/_components/awards-information/awards-information-screen.tsx:16-37`, `app/(main)/_components/awards-information/award-detail-card.tsx:57-115`, `app/(main)/_wiring/build-awards-information-props.ts:15-45`, `lib/awards/award-details.ts:17-63`

---

### 3.2 CAP-02 — Điều hướng giữa các hạng mục

#### A2 · Bấm mục menu để tới hạng mục
`browser · click` → `` `useAwardCategorySpy#select` ``
`FR-401` `FR-402` `BR-002` `DEC-001` `US002` · `SCR004_AwardsInformation`

**Who** · Người dùng đã đăng nhập *(gate A0 — § 4.4)*
**FE** · Mỗi mục là liên kết `<a href="#<slug>">`; bấm (chuột chính, không phím bổ trợ) thì chặn mặc định, đặt mục đó active (vàng, gạch chân), cuộn mượt tới phần tương ứng (tức thì nếu `prefers-reduced-motion`) rồi ghi `#<slug>` bằng `history.replaceState(null, …)`, không thêm mục lịch sử (FR-401, D007). Bấm kèm Ctrl, Meta, Shift, Alt hoặc nút không phải chuột chính thì không chặn: trình duyệt tự theo `href` (mở tab mới…). Rê chuột làm mục sáng lên (`hover:bg-white/10 hover:text-saa-gold`, FR-402).
**Request** · không có; chỉ thao tác phía client
**BE** · *none*
**Rule** · **BR-002 — Tại mọi thời điểm đúng một mục menu ở trạng thái active; mặc định là mục đầu.** Bấm một mục đặt riêng mục đó active. *(§ 4.4)* Nguồn nào quyết định mục active (bấm, hash, cuộn) nằm ở DEC-001 trong A4.
**Result** · trang cuộn tới phần hạng mục, đúng một mục active (US002). Khi cuộn mượt đang chạy, scroll-spy (A3) không được giành lại trạng thái active giữa chừng; cách chặn: khoá cuộn `createScrollLock` (mô tả ở ALG-001, § 4.5).
**Source:** `app/(main)/_behavior/use-award-category-spy.ts:61-69`, `app/(main)/_behavior/award-scroll-lock.ts:132-136`, `app/(main)/_components/awards-information/awards-category-menu.tsx:21-53`, `app/(main)/_wiring/awards-category-menu-container.tsx:16-25`

---

#### A3 · Scroll-spy: phần đang xem quyết định mục active
`browser · scroll` → `` `useAwardCategorySpy` (scroll listener) ``
`FR-403` `BR-002` `DEC-001` `ALG-001` `US002` · `SCR004_AwardsInformation`

**Who** · Người dùng đã đăng nhập *(gate A0 — § 4.4)*
**FE** · Khi người dùng tự cuộn, mục menu của phần đang nằm trên đường chuẩn dưới header trở thành active (FR-403). Sự kiện `scroll` chỉ xếp một lần tính lại vào `requestAnimationFrame`. Trên tab ngang (dưới 1024px) cùng quy tắc áp dụng; hàng tab tự cuộn ngang để tab active luôn trong tầm nhìn (`useKeepActiveTabInView`, chỉ cuộn chính hàng tab, không cuộn trang).
**Request** · không có; theo dõi vị trí 6 phần trong khung nhìn
**BE** · *none*
**Rule** · **BR-002 — Tại mọi thời điểm đúng một mục menu ở trạng thái active; mặc định là mục đầu.** Scroll-spy chỉ chọn một phần, không bao giờ để hai mục cùng active hay không mục nào. *(§ 4.4)* DEC-001 (xem A4): khi không có hash hợp lệ ép buộc, vị trí cuộn quyết định mục active; cách chọn phần nằm ở ALG-001 (§ 4.5): chọn phần cuối cùng có mép trên đã lên tới đường chuẩn dưới header; cuộn sát đáy trang thì chọn phần cuối. Trong lúc khoá cuộn (click hoặc hash) scroll-spy không tính lại (xem ALG-001).
**Result** · mục menu active theo kịp vị trí cuộn (US002); phần đầu trang (hero, tiêu đề) giữ mục đầu active.
**Source:** `app/(main)/_behavior/use-award-category-spy.ts:27-38,71-96`, `app/(main)/_behavior/use-keep-active-tab-in-view.ts:12-23`

---

#### A4 · Hash đường dẫn: tới đúng hạng mục khi mở trang
`browser · tải trang và hashchange` → `` `useAwardCategorySpy` (`applyHash`) ``
`FR-404` `FR-405` `BR-002` `DEC-001` `US003` · `SCR004_AwardsInformation`

**Who** · Người dùng đã đăng nhập, thường đến từ thẻ giải thưởng ở trang chủ *(gate A0 — § 4.4)*
**FE** · Khi trang mở với `/awards-information#<slug>` hoặc hash đổi, trang cuộn tới phần đó và đặt mục tương ứng active (FR-404; áp cả khi vào từ thẻ trang chủ). Hash không khớp slug nào thì bỏ qua, không báo lỗi (FR-405).
**Request** · `#<slug>` của URL
**BE** · *none*
**Rule** · **BR-002 — Tại mọi thời điểm đúng một mục menu ở trạng thái active; mặc định là mục đầu.** Hash không hợp lệ cũng không được làm mục nào mất active hay lệch khỏi mặc định. *(§ 4.4)*

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-001** | interaction | hash khớp một slug trong 6 hạng mục | Cuộn tức thì tới phần đó (không smooth), mục tương ứng active (hash thắng scroll-spy lúc tải) | `use-award-category-spy.ts:84-91` |
| **DEC-001** | interaction | hash có nhưng không khớp slug nào | Trang ở lại đầu, mục đầu active, không lỗi JavaScript (FR-405) | `award-hash.ts:8-18`, `use-award-category-spy.ts:86` |
| **DEC-001** | interaction | không có hash | Vị trí cuộn quyết định mục active (A3); lúc mở trang là mục đầu (hoặc mục tại vị trí cuộn được trình duyệt khôi phục khi tải lại) | `use-award-category-spy.ts:125` |

**Result** · deep link từ trang chủ hạ cánh đúng hạng mục (US003); hash sai không phá trang. Bấm menu có ghi hash (`replaceState`, A2); scroll-spy không đổi URL (D007). `parseAwardHash` giải mã hash cẩn thận (`decodeURIComponent` trong `try`) và chỉ so với danh sách slug cố định, không bao giờ dùng làm selector.
**Source:** `app/(main)/_behavior/award-hash.ts:8-18`, `app/(main)/_behavior/use-award-category-spy.ts:84-91,125,134`

---

### 3.3 CAP-03 — Đi tới Sun* Kudos

#### A5 · Nút "Chi tiết" của khối Sun* Kudos
`browser · điều hướng` → `` `KudosPromo` (dùng lại của F003_Homepage) ``
`FR-204` `FR-408` `US004` · `SCR004_AwardsInformation`

**Who** · Người dùng đã đăng nhập *(gate A0 — § 4.4)*
**FE** · Khối Sun* Kudos ở cuối trang: nhãn, tiêu đề, mô tả, hình minh hoạ và nút "Chi tiết" (FR-204). Nút là liên kết cùng tab tới `/sun-kudos` (FR-408). Tái dùng `KudosPromo` với `variant="wide"` (khối 1152px theo Figma `335:12023`); trang chủ giữ `variant` mặc định 1120px (D008). Chuỗi dùng chung qua `buildKudosPromoProps`.
**Request** · điều hướng `/sun-kudos`
**BE** · *none*
**Result** · mở trang Sun* Kudos (hiện là trang giữ chỗ do F003_Homepage dựng); route không tồn tại thì Next hiện 404 mặc định (US004).
**Source:** `app/(main)/_components/kudos-promo.tsx:14-24`, `app/(main)/_wiring/build-kudos-promo-props.ts:5-17`, `app/(main)/_components/awards-information/awards-information-screen.tsx:34`

---

### 3.4 Edge cases

| Action | Scenario | Behavior |
|---|---|---|
| A4 | Hash không khớp slug (`#abc`) | Bỏ qua, trang ở đầu, mục đầu active, không lỗi JavaScript (DEC-001, FR-405) |
| A2 · A3 | Bấm mục rồi trang vẫn đang cuộn mượt | Scroll-spy không đổi active giữa chừng; kết thúc cuộn thì chỉ mục đã bấm active (BR-002) |
| A2 · A3 | Người dùng cuộn tay (lăn chuột, chạm, phím cuộn, kéo thanh cuộn) khi khoá đang giữ | Khoá nhả ngay, scroll-spy theo vị trí người dùng (ALG-001) |
| A2 | Bấm kèm Ctrl/Meta/Shift/Alt hoặc chuột giữa | Không chặn, trình duyệt tự xử lý liên kết; không cuộn, không đổi active |
| A3 | Cuộn tới hero, tiêu đề (trước phần đầu tiên) | Mục đầu active (BR-002) |
| A1 | Cửa sổ đổi qua mốc 1024px | Menu chuyển giữa dọc dính và tab ngang, mục active giữ nguyên (DEC-002) |
| A5 | `/sun-kudos` lỗi hoặc không tồn tại | Next hiện trang 404 mặc định; không tự thêm thông báo lỗi riêng |
| A1 | Khách mở thẳng URL | Về `/login` bởi guard sẵn có (FR-601) |

## 4. Shared Foundation

### 4.1 Components

| Component | Responsibility | Used in | File |
|---|---|---|---|
| `AwardsInformationPage` | Route `/awards-information` (server); đọc ngôn ngữ, ghép props, dựng màn | A1 | `app/(main)/awards-information/page.tsx` (đã thay trang giữ chỗ) |
| `AwardsInformationScreen` | Bố cục trình bày: hero, menu (slot), 6 thẻ, khối Kudos | A1 | `app/(main)/_components/awards-information/awards-information-screen.tsx` |
| `AwardsInformationHero` | Keyvisual, dòng phụ "Sun* Annual Awards 2025", tiêu đề `h1` | A1 | `app/(main)/_components/awards-information/awards-information-hero.tsx` |
| `AwardsCategoryMenu` | Menu trình bày: dọc dính từ 1024px, hàng tab ngang dưới đó; `aria-current="location"` cho mục active | A2, A3, A4 | `app/(main)/_components/awards-information/awards-category-menu.tsx` |
| `AwardsCategoryMenuContainer` (client) | Nối menu với hook scroll-spy và hook giữ tab trong tầm nhìn | A2, A3, A4 | `app/(main)/_wiring/awards-category-menu-container.tsx` |
| `AwardDetailCard` | Một thẻ: ảnh, tiêu đề, mô tả, số lượng, giá trị (1–2 mức); `id` = slug; ảnh so le từ 768px | A1 | `app/(main)/_components/awards-information/award-detail-card.tsx` |
| `award-icons` | Ba biểu tượng SVG (`IconTarget`, `IconDiamond`, `IconLicense`) | A1, A2 | `app/(main)/_components/awards-information/award-icons.tsx` |
| `useAwardCategorySpy` (hook) | Một slug active từ click, vị trí cuộn và hash; tự quản lý khoá cuộn | A2, A3, A4 | `app/(main)/_behavior/use-award-category-spy.ts` |
| `createScrollLock` và các hàm kiểm tra | Khoá cuộn, nhận biết người dùng giành lại cuộn, click có phím bổ trợ | A2, A3 | `app/(main)/_behavior/award-scroll-lock.ts` |
| `parseAwardHash` | Hash thành slug hợp lệ hoặc `null` | A4 | `app/(main)/_behavior/award-hash.ts` |
| `useKeepActiveTabInView` (hook) | Cuộn ngang hàng tab để tab active hiện đủ | A3 | `app/(main)/_behavior/use-keep-active-tab-in-view.ts` |
| `buildAwardsInformationProps`, `buildKudosPromoProps` | Ghép từ điển, `AWARD_CATEGORIES`, `AWARD_DETAILS` thành props; khối Kudos dùng chung với trang chủ | A1, A5 | `app/(main)/_wiring/build-awards-information-props.ts`, `app/(main)/_wiring/build-kudos-promo-props.ts` |
| `AWARD_DETAILS` | Khoá từ điển của mô tả, số lượng, giá trị cho 6 giải (cùng thứ tự `AWARD_SLUGS`) | A1 | `lib/awards/award-details.ts` |
| `KudosPromo` *(có sẵn, thêm prop `variant`)* | Khối quảng bá Sun* Kudos; `variant="wide"` cho trang này | A5 | `app/(main)/_components/kudos-promo.tsx` |
| Header, footer; `ComingSoonPage` không còn dùng cho route này | Vỏ dùng chung của `(main)` | A1 | `app/(main)/layout.tsx`, `app/(main)/_behavior/coming-soon-content.tsx` |

### 4.2 Data Model

#### Key Entities

| Entity | Table | Key Columns | Purpose |
|--------|-------|-------------|---------|
| — | — | — | Không có bảng; 6 hạng mục là dữ liệu tĩnh (`AWARD_CATEGORIES` trong `lib/awards/award-categories.ts`, có sẵn) cộng khoá chuỗi trong từ điển |

#### Polymorphic Behavior

N/A — no discriminator fields in Key Entities.

### 4.3 State Management

None — mục active là một giá trị slug (`useState`) trong hook `useAwardCategorySpy` (mặc định mục đầu, server và lần render client đầu khớp nhau), không lưu bền, không đủ ngưỡng thành state machine. Khoá cuộn là biến cục bộ (`run`, `anchorY`) trong `createScrollLock`, không phải state của React. Hash trong URL là đầu vào lúc tải và khi `hashchange` (A4); bấm menu ghi lại hash bằng `replaceState`.

### 4.4 Shared Rules

#### Bin 3 — cross-cutting, belongs to no single action

**A0 · FR-001 / FR-601 / BR-003 — mọi hành động của trang cần phiên đã xác minh; chuỗi lấy từ từ điển vi/en; tiếng Việt bám Figma.**
FR-601: lớp bảo vệ sẵn có (proxy cộng layout `(main)`) áp cho `/awards-information`; không xác minh được phiên thì về `/login`; feature này không đổi lớp đó. FR-001: toàn bộ chuỗi mới thêm vào từ điển hiện có của F002_Localization (không lập từ điển thứ hai), cặp khoá vi/en khớp ở lúc biên dịch. BR-003: tiếng Việt lấy nguyên văn từ Figma/MoMorph, tiếng Anh do nhóm tự soạn. **Không phải quy tắc riêng của feature này** mà kế thừa từ F001_Auth, F002_Localization và F003_Homepage.
**Source:** `lib/i18n/dictionary-awards-vi.ts`, `lib/i18n/dictionary-awards-en.ts`, `lib/i18n/dictionary-vi.ts:22`, `lib/i18n/dictionary-en.ts:23`, `lib/supabase/proxy.ts`

#### Bin 2 — used by ≥2 named actions

**BR-002 — Tại mọi thời điểm đúng một mục menu ở trạng thái active; mặc định là mục đầu.**
Used in: **A2** · **A3** · **A4**. A2 đặt mục vừa bấm active, A3 đặt mục của phần đang xem, A4 đặt mục theo hash (hash sai thì giữ mặc định). Cả ba ghi vào cùng một giá trị active để không bao giờ có hai mục sáng cùng lúc.
**Source:** `app/(main)/_behavior/use-award-category-spy.ts:53,64,87,75`

```text
active = first item                       # default
on click(slug)        -> active = slug     # A2
on hash valid(slug)   -> active = slug     # A4
on hash invalid       -> active unchanged  # A4, no error
on scroll (user)      -> active = ALG-001  # A3, skipped while a click/hash scroll holds the lock (ALG-001)
```

### 4.5 Algorithms & Integrations

### Chọn hạng mục đang xem khi cuộn (ALG-001)

**Linked FR:** FR-403
**Used in:** A3
**Source:** `app/(main)/_behavior/use-award-category-spy.ts:27-38`, `app/(main)/_behavior/award-scroll-lock.ts:24-30`
**Input:** vị trí đầu của 6 phần so với khung nhìn, chiều cao header cố định · **Output:** một slug hạng mục · **Complexity:** O(6) mỗi lần cập nhật
**Description:** Chọn phần cuối cùng có mép trên đã lên tới hoặc qua đường chuẩn ngay dưới header; chưa phần nào qua đường chuẩn thì giữ mục đầu. Theo dõi bằng sự kiện `scroll` cộng `requestAnimationFrame` (không dùng `IntersectionObserver`); kết quả luôn là đúng một slug.
**Khoá cuộn (A2, A3, A4):** click hoặc hash bắt đầu một lần cuộn có chủ đích thì `createScrollLock.begin(slug)` giữ scroll-spy lại để các phần đi ngang qua không nháy active. Khoá chỉ nhả khi phần đích đã tới đường chuẩn (sai số 8px, hoặc đã sát đáy trang): bằng `scrollend`, hoặc lần kiểm lại sau 150ms không có sự kiện `scroll` mới (lần kiểm đầu sau 1000ms nếu chưa có sự kiện nào). Hạn chót cứng 1500ms: quá hạn thì nhả không ghim và đọc lại vị trí cuộn. Người dùng giành lại cuộn (lăn chuột, chạm, phím `PageUp/PageDown/Home/End/Space/ArrowUp/ArrowDown`, nhấn vào thanh cuộn của trang) thì nhả ngay; riêng cử chỉ ngang trên hàng tab dưới 1024px (khi hàng tràn) là cuộn hàng tab, không phải giành lại. Sau khi nhả vì đã tới đích, các sự kiện `scroll` còn sót ở đúng vị trí đó không tính lại.
**Pseudocode:**
```text
line = scrollMarginTop(first section) + 8      # LINE_TOLERANCE_PX = 8; fallback 80px (header) if no margin
current = first slug
for each section in display order:
    if section.top <= line: current = section.slug
return last slug if page is at the bottom (within 2px) else current
```

### 4.6 Configuration

None.

**Client behavior:** see behavior-logic.md, permissions.md, architecture.md

## 5. Verification & Technical Notes

### 5.1 Technical Verification

Chính sách kiểm thử: `e2e-red-first` (Playwright đã có, chạy bằng `bun run test:e2e`): viết kịch bản E2E đỏ trước rồi làm xanh. Test case MoMorph dùng `/he-thong-giai`; đã thay bằng `/awards-information` (clarifications.md).

- **SC-001** *(A1)* Đã đăng nhập mở `/awards-information` thấy trang Hệ thống giải; khách về `/login`; bấm "Awards Information" trên header thì tới trang và mục đó sáng (covers FR-101, FR-102, FR-601)
- **SC-002** *(A1)* Có tiêu đề phụ "Sun* annual awards 2025" và tiêu đề chính "Hệ thống giải thưởng SAA 2025"; menu đủ 6 mục đúng thứ tự; 6 thẻ đủ ảnh, tiêu đề, mô tả, số lượng, giá trị theo Figma (covers FR-201, FR-202, FR-203, FR-002, BR-001)
- **SC-003** *(A2)* Bấm lần lượt từng mục: trang cuộn tới đúng phần, chỉ mục đó active; rê chuột có highlight (covers FR-401, FR-402, BR-002)
- **SC-004** *(A3)* Cuộn tay qua từng phần thì mục active theo kịp (covers FR-403, ALG-001, DEC-001)
- **SC-005** *(A4)* `/awards-information#mvp` cuộn tới và kích hoạt MVP; thẻ trang chủ tới đúng phần; `#abc` không lỗi JavaScript, ở đầu trang, mục đầu active (covers FR-404, FR-405, DEC-001)
- **SC-006** *(A1)* Từ 1024px trở lên menu dính dưới header khi cuộn; dưới 1024px là một hàng tab cuộn ngang cùng kiểu active (covers FR-406, FR-407, DEC-002)
- **SC-007** *(A5)* Khối Sun* Kudos đủ nhãn, tiêu đề, mô tả và "Chi tiết" tới `/sun-kudos`; route không có thì 404 (covers FR-204, FR-408)
- **SC-008** *(A0)* Đổi ngôn ngữ EN thì toàn bộ chuỗi trang đổi theo, VN đúng nguyên văn Figma (covers FR-001, BR-003)

#### US001 *(A1)*
**Independent Test:** Đăng nhập bằng phiên giả lập, mở `/awards-information`, đọc 6 thẻ.
**Acceptance Scenarios:**
1. **Given** người dùng đã đăng nhập, **When** mở `/awards-information`, **Then** thấy tiêu đề, menu 6 mục, 6 thẻ đủ nội dung và khối Sun* Kudos.

#### US002 *(A2, A3)*
**Independent Test:** Bấm mục menu rồi cuộn tay và đọc mục active.
**Acceptance Scenarios:**
1. **Given** trang vừa mở, **When** bấm "MVP", **Then** trang cuộn tới thẻ MVP và chỉ MVP active.
2. **Given** đang ở thẻ Top Project, **When** cuộn tới Best Manager, **Then** Best Manager active, Top Project mất active.

#### US003 *(A4)*
**Independent Test:** Mở thẳng URL kèm hash.
**Acceptance Scenarios:**
1. **Given** người dùng đang ở trang chủ, **When** bấm thẻ Best Manager, **Then** tới `/awards-information#best-manager` đúng phần và mục active.
2. **Given** hash `#abc`, **When** mở trang, **Then** không lỗi và mục đầu active.

#### US004 *(A5)*
**Independent Test:** Bấm "Chi tiết" ở khối Sun* Kudos.
**Acceptance Scenarios:**
1. **Given** ở cuối trang, **When** bấm "Chi tiết", **Then** URL thành `/sun-kudos` trong cùng tab.

#### US005 *(A1)*
**Independent Test:** Mở URL khi chưa có phiên.
**Acceptance Scenarios:**
1. **Given** khách chưa đăng nhập, **When** mở `/awards-information`, **Then** bị chuyển về `/login`.

### 5.2 Assumptions

- *(A1)* Ảnh 6 thẻ dùng lại `public/images/homepage/awards/<slug>.png` (336×336) và keyvisual dùng lại `public/images/homepage/keyvisual.png`, trừ khi node Figma khác (clarifications.md).
- *(A1, A2)* Menu dính nằm dưới header cố định cao 80px hiện có của `(main)`; vị trí cuộn tới phần phải trừ chiều cao đó để tiêu đề thẻ không bị che.
- *(A0)* Khoá từ điển mới theo tiền tố `awards.*`; dùng chung cặp khoá tiêu đề, mô tả của trang chủ nếu nội dung Figma giống nhau, nếu khác thì thêm khoá riêng (xem § 5.3).
- *(A5)* `/sun-kudos` đã là route được bảo vệ do F003_Homepage dựng.

### 5.3 Unresolved Questions

1. **Phiên bản Next.js** *(A1)*: dự án dùng Next.js có khác biệt so với kiến thức quen thuộc (xem AGENTS.md); phải đọc hướng dẫn trong `node_modules/next/dist/docs/` trước khi viết route và thành phần client.
2. **Mô tả đầy đủ 6 giải** *(A1)*: đã chốt (D005) — nguyên văn node Figma D.1 tới D.6, nằm trong `lib/i18n/dictionary-awards-vi.ts` (bản en do nhóm soạn trong `dictionary-awards-en.ts`).
3. **Chặn scroll-spy lúc cuộn mượt** *(A2, A3)*: đã chốt — khoá cuộn có hạn chót, nhả khi tới đích hoặc khi người dùng giành lại cuộn (mô tả ở ALG-001, § 4.5).
4. **Cập nhật hash khi bấm menu** *(A2, A4)*: đã chốt (D007) — chỉ khi bấm, dùng `history.replaceState`; scroll-spy không đổi URL.
5. **`KudosPromo` có khớp node `335:12023`** *(A5)*: đã chốt (D008) — lệch kích thước (1152px so với 1120px) nên thêm biến thể `variant="wide"`, bản trang chủ không đổi.

### 5.4 Source References

Mã nguồn: `app/(main)/awards-information/page.tsx`, `app/(main)/_components/awards-information/`, `app/(main)/_behavior/{award-hash,award-scroll-lock,use-award-category-spy,use-keep-active-tab-in-view}.ts`, `app/(main)/_wiring/{awards-category-menu-container.tsx,build-awards-information-props.ts,build-kudos-promo-props.ts}`, `lib/awards/{award-categories,award-details}.ts`, `lib/i18n/dictionary-awards-{vi,en}.ts`. E2E: `e2e/awards-information-{access-and-content,category-navigation,responsive-layout}.spec.ts`, `e2e/support/awards-information-locators.ts`. Hành vi: xem `## 7. User Stories` trong functional-spec.md.

#### Data Flow

```text
Request /awards-information -> guard (A0) -> AwardsInformationPage (locale, dict, 6 hạng mục) -> HTML
Click menu / hash / scroll -> AwardsCategoryMenu -> active slug (BR-002) + cuộn tới #slug
Click "Chi tiết" -> điều hướng /sun-kudos
```

### 5.5 Artifact References

| Artifact | File | Codes Used | Reviewed |
|----------|------|------------|----------|
| System Overview | [overview.md](../../system/overview.md) | — | [ ] |
| Architecture | [architecture.md](../../system/architecture.md) | — | [ ] |
| Feature List | [feature-list.md](../../generated/feature-list.md) | F### (cấp lúc promote) | [ ] |
| API Map | [api-map.md](../../generated/api-map.md) | TBD (draft) | [ ] |
| Entities | [entities.md](../../generated/entities.md) | TBD (draft) | [ ] |
| Screens | [functional-spec.md § 6](./functional-spec.md#6-screens) | TBD (draft) | [ ] |
| Behavior Logic | [behavior-logic.md](../../generated/behavior-logic.md) | TBD (draft) | [ ] |
| Permissions Matrix | [permissions-matrix.md](../../generated/permissions-matrix.md) | TBD (draft) | [ ] |
| User Stories | [user-stories.md](../../generated/user-stories.md) | TBD (draft) | [ ] |
