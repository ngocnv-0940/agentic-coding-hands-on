# Clarifications — Sun* Kudos Live board

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ (fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `MaZUn5xHXZ`, Figma node `2940:13431`, frame "Sun* Kudos - Live board", 1440×5862)
Sources: `momorph/kudos-live-board-specs.csv` (64 items), `momorph/kudos-live-board-test-cases.csv` (41 cases), `momorph/kudos-live-board-frame.png`

## Session 2026-10-14 (auto-picked Recommended per user standing rule — test project, no rest-point questions)

- Q: Route? → A: `/sun-kudos` inside `app/(main)` (header nav "Sun* Kudos" and footer already link there). Replaces the current Coming soon page. Signed-in only, same as every `(main)` page (proxy + layout guard). TC "unauthenticated → login" is covered by the existing guard.
- Q: Data source — static or real DB? → A: Real Supabase Postgres. New migrations under `supabase/migrations/` (first migrations in the repo) + `supabase/seed.sql` seeded from Figma content. Spec says hashtags, departments, kudos and totals are "queried from DB"; static data would be a fake implementation.
- Q: Tables? → A: Minimum the screen reads/writes: `departments`, `sunners` (profile: user_id nullable link to auth.users, full name, avatar url, department, hero title), `hashtags`, `kudos` (sender, receiver, content, created_at, is_special_day snapshot not needed — see like rule), `kudo_hashtags`, `kudo_images`, `kudo_likes` (kudo_id, user sunner, hearts_awarded 1|2, unique (kudo_id, sunner_id)), `special_days` (date), `secret_boxes` (owner, opened_at, prize_description). Names finalised by the planner; must stay this small.
- Q: Like rules (C.4.1)? → A: Enforced in Postgres via one `SECURITY DEFINER` RPC `toggle_kudo_like(kudo_id)`: one like per user per kudo (unique key), sender cannot like own kudo (error), like on a `special_days` date awards 2 hearts to the sender else 1, unlike revokes exactly the `hearts_awarded` stored on that like row. Hearts total for a sunner = sum of `hearts_awarded` on likes of kudos they sent.
- Q: Who is "the current user" in sidebar stats? → A: The `sunners` row whose `user_id = auth.uid()`. No row (user not in seed) → stats show 0 and the heart button works as a non-sender; the RPC creates nothing else. A logged-in user without a sunners row cannot like (RPC raises) — planner may instead auto-create the row on first like; pick the smaller of the two.
- Q: Highlight Kudos? → A: Top 5 kudos by like count (tie → newest), after the active filters. Carousel: centre card full, neighbours faded and inert; prev disabled on 1, next disabled on last; pager "n/N"; filter change resets to 1. Empty → "Hiện tại chưa có Kudos nào."
- Q: Filters? → A: Hashtag and Phòng ban dropdowns (options from DB), single-select each, combinable (AND), with a clear option. State lives in the URL query (`?hashtag=<slug>&department=<code>`), so a click on a card hashtag sets `hashtag` and both Highlight and All Kudos re-render from the server. Dropdown visuals: MoMorph frames "Dropdown Hashtag filter" (JWpsISMAaM) and "Dropdown Phòng ban" (WXK5AYB_rG) if the UI agent needs them; otherwise reuse the existing dropdown panel styles.
- Q: All Kudos pagination? → A: Infinite scroll, page size 10, newest first, cursor = (created_at, id). Load more via a server action / route handler, IntersectionObserver sentinel, plus an accessible "load more" fallback is NOT required (YAGNI).
- Q: Text clamps / formats? → A: Highlight content 3 lines, All Kudos content 5 lines (`line-clamp`); hashtags one line, max 5, overflow "…"; time `HH:mm - MM/DD/YYYY` in Asia/Ho_Chi_Minh; images max 5 thumbnails; like count with `.` thousands separator as Figma ("1.000").
- Q: Copy Link? → A: Copies absolute URL `${origin}/sun-kudos/<kudoId>`; toast "Link copied — ready to share!" (same text both locales — Figma copy); toast auto-hides after ~3 s.
- Q: Targets not in this screen (Kudo detail page, profile pages, hover profile preview, Send-kudo dialog "Viết Kudo", Secret Box dialog)? → A: Out of scope — they are separate MoMorph screens. Links point at the routes they will use: kudo detail `/sun-kudos/<id>` (new placeholder route rendering the existing Coming soon page), profile `/profile` (existing placeholder; `?id=` param not needed now). A.1 pill and "Mở Secret Box" open a small modal with the existing `comingSoon.title` text and a close button. No hover preview.
- Q: Spotlight board? → A: Render receiver names (distinct receivers, most recent first, cap 100 nodes) scattered in the dark board with deterministic positions (seeded hash of id — stable SSR/CSR), header "<total> KUDOS" = total kudos count from DB. Hover node → tooltip "name · HH:mm - MM/DD/YYYY" of their latest kudo; click node → `/sun-kudos/<latestKudoId>`. Pan/Zoom button toggles drag-pan + wheel-zoom on the canvas (CSS transform, no library). Search input (max 100 chars, `maxLength`) highlights matching names; empty search clears highlight (no error message — the TC's "required message" contradicts spec "Không bắt buộc"; spec wins). Loading = Suspense fallback; empty = "Chưa có dữ liệu". The scrolling recent-activity ticker lines at the bottom left are display-only, from the 5 latest kudos.
- Q: Second search pill "Tìm kiếm profile Sunner" next to A.1 in the frame (not in specs)? → A: Render it as Figma draws it (Figma wins on visuals). No spec behaviour exists and profile search is a separate screen, so it opens the same Coming soon modal as A.1. Logged under plan Unresolved.
- Q: Sidebar? → A: Stats for current user: kudos received, kudos sent, hearts received, secret boxes opened, secret boxes unopened; "Mở Secret Box" button (modal per above; disabled when unopened = 0). "10 SUNNER NHẬN QUÀ MỚI NHẤT": 10 latest opened secret boxes with prize. Figma also shows (in specs) "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" but the frame draws only the gift list → follow the frame (Figma wins). Empty list → "Chưa có dữ liệu". Sidebar sticky with its own scroll.
- Q: Hoa thị / danh hiệu (hero badge "New Hero", "Rising Hero", "Super Hero", "Legend Hero")? → A: Badge stored on `sunners.hero_title`; star count derived from kudos received (≥10 → 1, ≥20 → 2, ≥50 → 3) per B.3.2; hover star → native `title` tooltip with the spec text. Badge artwork from Figma.
- Q: Localization? → A: All UI strings VI/EN in a new `lib/i18n/dictionary-kudos-{vi,en}.ts` merged like the awards dictionaries. User content (names, messages, hashtags) not translated.
- Q: Responsive? → A: Figma has only 1440. Derived: <1024 the sidebar stacks above/below the feed, carousel shows one card, no horizontal scroll at 375 (same approach as F004).
- Q: Test policy? → A: `e2e-red-first` (behaviour: like toggle, filters, carousel navigation, copy toast, infinite scroll). Runner exists: `bun run test:e2e` (`@playwright/test`).
- Q: How does E2E get data without Docker? → A: Extend `e2e/support/mock-supabase-server.ts` with the PostgREST/RPC routes the app calls (`/rest/v1/...`), backed by in-memory fixtures built from Figma content, enforcing the same like rules as the SQL RPC. The real SQL is verified separately by a `@smoke` spec / `supabase db reset` when Docker is available (not required for the default run).
- Q: Branch? → A: `feat/kudos-live-board` from `origin/master` (21351af).

## Session 2026-10-14 (system-doc draft concerns, auto-picked Recommended)

- Q: Signed-in user with no `sunners` row? → A: No auto-create (YAGNI). The page reads the current sunner; when absent, the heart buttons render disabled, stats read 0, and the RPC raises `not_a_sunner` as a server-side backstop. Seed links the e2e/mock user to a sunner row so the like path is testable.
- Q: Special-day timezone? → A: Asia/Ho_Chi_Minh — `special_days.day` compared with `(now() at time zone 'Asia/Ho_Chi_Minh')::date` at like time.
- Q: Server Action vs Route Handler? → A: Server Actions for both load-more and like toggle (no public API surface needed).
- Q: `secret_boxes` readable by all authenticated users? → A: Yes — the latest-gift list is public inside the app; it holds only owner, prize text and opened_at.

## Session 2026-10-14 (Stage 1.5 spec gaps, auto-picked Recommended)

- Q: "IDOL GIỚI TRẺ" title + pencil icon on All Kudos cards? → A: A per-kudo `title` column, display-only (the pencil is decorative; editing is a separate screen).
- Q: Clicking an attached image? → A: Open the original image in a new tab.
- Q: Spotlight search matching? → A: Case-insensitive and Vietnamese-diacritic-insensitive substring match.
- Q: Unknown `hashtag`/`department` value in the URL? → A: Ignore it (treat as no filter).
- Q: Error toasts (like, clipboard, load more) and EN copy for new labels (Figma has VI only)? → A: Implementer adds short VI/EN strings; listed for user confirmation in plan Unresolved.
- Q: Special-day timezone? → A: Asia/Ho_Chi_Minh (already decided above).
- Q: Spotlight zoom range? → A: 0.5 to 3.
- Q: Sidebar placement under 1024px? → A: Below the feed.

## Session 2026-10-14 (planner)

- Q: Read path — PostgREST table selects with embeds, or SQL functions? → A: Five `SECURITY INVOKER` `stable` SQL functions returning camelCase jsonb (`kudos_filter_options`, `kudos_highlight`, `kudos_feed_page`, `kudos_spotlight`, `kudos_sidebar`) plus `toggle_kudo_like` (definer). ALG-001 needs ordering by like count, one call returns the nested card, and the E2E mock serves 6 RPCs instead of re-implementing PostgREST filter grammar. RLS still applies (invoker). Contract: phase-03 §RPC contract.
- Q: `canLike` computed where? → A: In SQL per card (viewer sunner exists and is not the sender); UI only renders it.
- Q: Mock isolation under `fullyParallel`? → A: Per-identity datasets (new stub identities `kudos-sender`, `kudos-liker`, `kudos-outsider` = no sunner, `kudos-empty` = empty board) + mock-only control endpoints `/__e2e/kudos/reset` and `/__e2e/kudos/special-today`, used only by the serial like spec.
- Q: SQL verification? → A: pgTAP under `supabase/tests/database/`, run with `supabase test db` after `supabase db reset` (CLI built-in, no npm dependency). No container runtime → recorded BLOCKED, not skipped.
- Q: Seed `sunners.user_id`? → A: null (real Google uids unknown); manual local testing links a user with one `update`. pgTAP impersonates via `request.jwt.claims`.
- Q: Existing spec asserting `/sun-kudos` is Coming soon (`e2e/homepage-access-and-landing.spec.ts`)? → A: Phase 1 removes `/sun-kudos` from that loop; `/sun-kudos/x` stays covered by the new `[id]` placeholder.
- Q: Client state across filter changes (Activity keeps state on `router.replace`)? → A: Carousel and feed containers keyed by `${hashtag}|${department}`.
- Q: Like UI update style? → A: No optimistic flip: button pending until the RPC answers (DEC-003), then apply `{liked, likeCount}`; action does not call `refresh()`/revalidate (no Highlight reorder).
- Q: Track A vs lib types? → A: Track A owns view prop types in `_components/kudos-view-types.ts`, lib owns `kudo-board-types.ts`; both match the phase-03 contract field for field and phase 6 wiring passes rows straight through (tsc proves compatibility).

## Session 2026-10-14 (phase 3 hand-off)

- Q: RPC error name for a user without a sunners row — `not_a_sunner` (earlier note) or `sunner_not_found` (phase-3 contract + mock)? → A: `sunner_not_found`. Supersedes the earlier wording.
- Q: Helper SQL functions outside the 6 contract RPCs? → A: Accepted in schema `kudos_private` (not exposed by PostgREST).
- Note: real-DB star counts derive from seed kudos, the E2E mock pins `receivedCount` per tier — visual checks on the real stack show fewer stars. Accepted.

## Session 2026-10-14 (visual verdict after polish round 2, auto-picked Recommended per user)

- Q: 1440 visual still outside the tester's ±4/±2 px tolerance after two polish rounds (banner bottom +32 px, filter gap 16 vs 8 px and widths +2 px, highlight card +17 px ≈3%, pager ≈+19 px, Spotlight/All Kudos ≈+24 px cascade). The UI agent applied MoMorph node values (authoritative per the MoMorph contract); the tester read Figma positions by eye from the frame PNG, and the shared (main) header/footer (out of scope) shifts y offsets. Accept or run a third polish round? → A (auto-picked): Accept as a minor deviation (under 6%, same rule as F005 phase 5), no layout or legibility impact; 768/375 pass. Follow-up (owner: UI, done = within ±4 px at 1440): filter-button gap/width and highlight card height. Evidence: `evidence/visual/visual-mismatch-list.md` "After polish round 2".
- Accepted known deviations: pager size measured from the PNG; shared header order/footer wrap/floating widget button belong to the shared `(main)` layout (other features).
- Not provable by E2E, accepted with reason: Spotlight loading state (no dedicated UI — board-wide Suspense fallback only); 100-node cap (enforced by `limit 100` in `kudos_spotlight`, fixture has 8 receivers).
- 2026-10-15 follow-up: Spotlight background artwork restored. MoMorph export still fails (500/401), so the two layers (root artwork 2940:14173 under a 70% black wash, network 2940:14181 screen-blended at 30%) were pulled through the Figma MCP `get_design_context` and saved as `public/images/kudos/spotlight-{roots,network}.webp`.

## Session 2026-10-16

- Q: "10 SUNNER NHẬN QUÀ MỚI NHẤT" lists 10 boxes or 10 people? → A: 10 distinct Sunners (MoMorph D.3 "10 Sunner vừa nhận quà mới nhất"), one row each with their newest opened box, newest opener first. Supersedes "10 latest opened secret boxes" above; a Sunner who opened several boxes no longer fills several rows. Migration `20261016030000_latest_gifts_distinct_sunners.sql`.
