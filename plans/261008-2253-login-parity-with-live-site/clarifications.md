# Clarifications — Login parity with live site

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz (Login, fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `GzbNeVGJHz`)
Language dropdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2 ("Dropdown-ngôn ngữ")
Live reference: https://saa.sun-asterisk.vn/login?redirect=%2F
Prior screen decisions: `plans/261008-0850-login-page-supabase-google/clarifications.md` (still valid where not overridden below)

## Session 2026-10-08

- Q: Source-of-truth order when local, Figma and live site differ? → A: **Figma (MoMorph frame + its attached specs/test cases) wins.** The live site only fills what Figma does not define. Our own generated docs (`docs/features`, `docs/screens`, old clarifications) do NOT outrank the live site where Figma is silent.
- Q: Login button label in VI ("LOGIN With Google" in Figma vs "ĐĂNG NHẬP với Google" live)? → A: Figma → keep "LOGIN With Google".
- Q: Logo clickable (live: link to `/`)? → A: Keep non-interactive (MoMorph TC b9805e65).
- Q: Homepage EN footer too? → A: Yes — "sửa cả footer theo trang thật": `home.footer.copyright` (en) = "Copyright © 2025 Sun* All rights reserved".
- Q: Login button hover (live: background #FFF8E1, no shadow)? → A: Keep shadow (MoMorph TC c18649fa).

## Derived decisions (rule applied, not re-asked)

Figma-defined → keep / restore Figma:
- Desktop 1440 composition: header padding 144, hero/text/button positions, text Montserrat 700 20/40 (whole text bold, no separate "SAA 2025" span), button 305×60 label 700 22px, footer Montserrat Alternates 700 16px, footer 91px tall. Local already matches; do not change at ≥1440.
- Language dropdown (Figma `hUyaaugye2`, local has drifted): panel `padding 6px`, bg `#00070C`, border `1px #998C5F`, radius 8px, items stacked with no gap, each item 56px tall `padding 16px`, flag 20×15 inside a 24px box + code label Montserrat 700 16/24 tracking 0.15px, selected item bg `rgba(255,234,158,0.2)` radius 2px.
- VI copy: unchanged.

Figma silent → follow live site:
- Content container: centered, `max-width` = Figma content width 1152px, side padding 12px (<640), 24px (640–767), 32px (≥768) until the centered width takes over (gives 144 at 1440, centered beyond). Header uses the same container so logo aligns with hero.
- ROOT FURTHER image: height 120px (<640), 160px (640–1023), width 451px (≥1024).
- Gap image→text 40px below `xl`; Figma 80px at `xl`+ (≥1280). Text block left indent (Figma 16px) only at `xl`+. (Figma's desktop-only spacing starts at `xl` so 1024 matches live — tester run 1 showed text x 48 vs live 32 at 1024 with `lg`.)
- Text below `md`: same 20/40 as desktop (live does not shrink); weight stays Figma 700. Button label 22px at all sizes. Footer text 16px at all sizes; footer vertical padding 24px below `xl` (Figma 91px footer from `xl`; 1920 keeps 91 as a Figma-desktop deviation from live 73).
- Language trigger: `padding 16px` at all sizes; hover bg `#FFEA9E1A`; chevron rotates 180° while open. Menu opens 8px below trigger, right-aligned; item hover bg `#FFEA9E1A`; shadow-lg.
- Background key visual below `lg`: covers full viewport, anchored right-center (live shows the right side of the artwork on phones).
- Login button disabled opacity 50%.
- EN copy (Figma has no EN): tagline "Login to explore!", footer "Copyright © 2025 Sun* All rights reserved"; subtitle, button, title unchanged. Supersedes old F002 D003 "authored by us" wording for these two strings.

- 1440 hero→text gap 80px (Figma frame 662:14394) vs live 40px → Figma wins; accepted (tester re-run 2 observation).

Out of scope (kept as is): fixed header/footer (spec + e2e), loading/error states, auth behavior, cookie locale storage.

testPolicy: `visual-contract` (presentational + responsive only; no new behavior).
