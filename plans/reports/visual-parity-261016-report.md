# Visual parity audit — implemented screens vs MoMorph/Figma (2026-10-16)

Read-only audit. No source, test or config file was edited. Screenshots: `plans/reports/visual-parity-261016/`
(capture script `capture-screens.mjs` in the same folder; crops in `slices/`).

**Method:** dev server `bun run dev -p 3100` against a mock Supabase on its own port (54401), login through
the stubbed-Google flow from `e2e/support/login-through-stubbed-google.ts`. Chromium at 1440px, full page.
`/prelaunch` ran on a second server with `SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00`. Both servers were stopped afterwards.

**Coverage limits**
- The MoMorph MCP tools are not available in this session, so the homepage (`i87tDx10uM`) and awards
  (`zFYDgyj_pD`) frames could not be fetched. Those two screens are compared only against the copy and spec CSVs.
- Frames are not all 1440 wide. The prelaunch frame is 1512x1077 and the login evidence is 1440x1024.
  Coordinates are coarse.
- `GET /login` is a 900px viewport. Design height is 1024, so the ~62px headline offset is viewport centering, not drift.
- The shared `(main)` header and footer are included in the sun-kudos and homepage findings.
- The `Cache disabled` badge is the Next dev overlay and is ignored.

## Per-screen table

### /login (login-1440.png) vs login evidence `figma-login-GzbNeVGJHz.png`
Match. The button (305x60), copy, footer and VN selector line up.

| Difference | Severity | Design vs actual | Likely file |
|---|---|---|---|
| Headline and body sit ~60px higher | LOW | Viewport height only (900 vs 1024). No fix needed | — |

### / homepage (homepage-1440.png) — no local frame; judged vs copy/spec and the shared header/footer
| Difference | Severity | Design vs actual | Likely file |
|---|---|---|---|
| Footer logo (SAA mark) missing at left | HIGH | Design footer shows the SAA logo. Actual footer has no logo | `app/(main)/_wiring/site-footer-container.tsx` and the footer view |
| Countdown tiles show `⊘` glyphs instead of digits when the event has already started (EVENT_START_AT 2025-12-26) | MED (verify) | Expected state after event start is unclear without the frame. Needs the homepage frame to confirm | `app/(main)/_wiring/countdown-container.tsx` |
| Header bell placed right of the language selector | MED | Design: bell left of `VN ▾`. Actual: bell after `VN ▾` | `app/(main)/layout.tsx` (header) |
| Footer links wrap to 2 rows, copyright wraps | LOW (accepted) | Design is one row. Already accepted as a known deviation in `plans/261014-0900-kudos-live-board/clarifications.md` L67–68 | site-footer view |

### /awards-information (awards-information-1440.png) — no local frame; judged vs `awards-system-specs.csv` and copy
| Difference | Severity | Design vs actual | Likely file |
|---|---|---|---|
| Quantity unit ("Cá nhân", "Tập thể") wraps onto 2 lines in a narrow box | MED | Spec: unit sits beside the number on one line. Actual: wrapped into a tight column | awards award-card quantity row (`lib/i18n/dictionary-awards-vi.ts` for copy; card component under `app/**/awards-information`) |
| Zig-zag image left/right alternation of award cards | UNVERIFIED | No frame locally to confirm | — |
| Category nav labels wrap ("Top Project Leader", "Signature 2025 - Creator") | LOW | Narrow nav column | awards category nav |

### /prelaunch (prelaunch-1440.png, SITE_LAUNCH_AT=2099)
| Difference | Severity | Design vs actual | Likely file |
|---|---|---|---|
| Digit glyphs use a rounded display face; design uses 7-segment LCD digits | MED | `countdown-prelaunch-frame.png`: segmented LCD digits. Actual: rounded face | prelaunch countdown view (`app/prelaunch/_wiring/prelaunch-countdown-container.tsx` and its view, plus the digit font/CSS) |
| Days field shows 5 digits (26374) instead of 2 | LOW (data) | Design sample is 00. Caused by the 2099 test date | — |
| Tile size, gaps, labels, title and gradient glass look match | — | Within coarse tolerance | — |

### /sun-kudos (sun-kudos-1440.png, 8070px) vs `kudos-live-board-frame.png` (1440x5862)
| Difference | Severity | Design vs actual | Likely file |
|---|---|---|---|
| Footer logo missing (same as homepage) | HIGH | Design: SAA logo at footer left | `site-footer-container.tsx` |
| Highlight side cards heavily greyed out, centre card has a gold outline | MED | Design: side cards cream with only an edge fade; centre card has no outline | `app/(main)/sun-kudos/_components/carousel-view.tsx`, `highlight-section.tsx` |
| Stat icon is 💔 (broken heart) instead of 🔥 flame with "x2" | MED | Design: flame icon for "Số tìm bạn nhận được" | `app/(main)/sun-kudos/_components/sidebar-view.tsx` |
| Card title row ("IDOL GIỚI TRẺ") absent on highlight and All Kudos cards | MED (verify) | Design: centred title row on every card. Actual: none. Mock kudos may have no title; confirm the slot renders when `title` is set | `kudo-card.tsx`, `carousel-view.tsx` |
| Header label "Awards Information" vs design "Award Information" (footer too) | LOW (decision) | `home.nav.awards` = "Awards Information" is the F003 decision (`plans/261013-0720-awards-information-page/clarifications.md` L22). Confirm which label the customer wants | `lib/i18n/dictionary-home-vi.ts` |
| Footer "Sun* Kudos" active pill (dark box) missing | LOW | Design highlights the current item in the footer | site-footer view |
| Kudo image thumbnails render as blank white boxes | LOW (mock) | Design: 5 photo thumbnails on the image kudos. Mock storage bytes may not resolve. Verify the mock serves images before fixing the app | `resolve-kudo-image-url.ts`, mock storage routes |
| "Mở Secret Box" button dimmed | LOW (state) | Design: bright yellow enabled button. Actual looks disabled, presumably because the secret-box count is 0 | `sidebar-view.tsx` |
| Heart counts grey (not liked) vs red in design | LOW (state) | Design shows red hearts for liked kudos. Data-driven | — |
| Stat values 0 and sunner list length 5 vs 25 and 10 | IGNORE (data) | Mock content | — |
| Floating "Viết Kudo" FAB pill over the content | IGNORE (intentional) | Shared widget button, per `plans/261015-1900-fab-and-modal-polish/clarifications.md`. Not in the board frame | — |
| Card uses placeholder grey avatars and "E2E User" names | IGNORE (data) | Mock content | — |

### write-kudo modal (write-kudo-dialog-1440.png, 1100px viewport) vs `write-kudo-frame.png`
Modal width (752px), field order, labels, toolbar, hashtag and image rows, the anonymous checkbox and the Hủy/Gửi row all match.

| Difference | Severity | Design vs actual | Likely file |
|---|---|---|---|
| Recipient field shows red border and "Không được để trống" immediately on open, before any input | HIGH | Design: no error state on open. Spec: error only after blur of a touched field or on submit. Field is autofocused and `aria-invalid="true"` on open | `app/(main)/sun-kudos/_components/recipient-picker-view.tsx`, `write-kudo-field-row.tsx` (touched logic) |
| Title "Gửi lời cảm ơn và ghi nhận đến đồng đội" is one line and smaller; design wraps to two lines at a larger size | MED | Design: ~40px heading wrapping at "đồng / đội". Actual: ~32px single line | `write-kudo-modal-view.tsx` (heading style) |
| Gửi button dimmed | LOW (intentional) | Design: bright yellow. Actual: `aria-disabled` dim while required fields are incomplete, as decided in `plans/261015-0950-write-kudo-modal/clarifications.md` | `write-kudo-footer-view.tsx` |
| Field labels sit ~24px left of the design's input column | LOW | Design input starts x≈555, actual x≈531 at 1440 | `write-kudo-field-row.tsx` |
| Modal height at 900px viewport clips the image row and Gửi | LOW (by spec) | Spec: internal scroll below 100dvh. Expected behaviour | `write-kudo-modal-view.tsx` |

## Summary of severity
- HIGH: 2 unique (footer logo missing on shared footer; recipient error shown on open).
- MED: 8 (header bell order, countdown glyph state needs verification, awards unit wrap, prelaunch digit font, highlight card dimming, stat icon, card title row verify, modal title size).
- LOW / accepted / data: the rest.

## Concerns / gaps
- Re-run with the homepage (`i87tDx10uM`) and awards (`zFYDgyj_pD`) frames to close those two screens. The MoMorph MCP tools were not reachable here.
- Confirm with the owner: "Awards Information" vs "Award Information" label; whether the countdown should show digits or hide after the event starts.
- The shared footer logo and bell order sit in the shared `(main)` layout, which other features own.

**Status:** DONE_WITH_CONCERNS
**Summary:** Captured six screens at 1440px against the local design frames. Login matches. Write-kudo modal layout matches, but the recipient field shows an error on open. Sun-kudos and the shared layout are missing the footer logo and have MED drift in the highlight cards and stat icon. Homepage and awards were compared against copy and spec only, because their frames are not local and the MoMorph tools are not reachable in this session.
**Concerns/Blockers:** MoMorph MCP tools unavailable, so homepage and awards frames were not fetched. Countdown-after-event-start and the "Awards/Award" label need a product decision. The shared footer and header belong to other features' layout.
