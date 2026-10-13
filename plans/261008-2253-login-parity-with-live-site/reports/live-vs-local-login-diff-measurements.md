# Live vs local /login — measured diff (2026-10-08)

Captured with project Playwright Chromium (`evidence/*.mjs`), live = https://saa.sun-asterisk.vn/login?redirect=%2F, local = `bun run dev -p 3200`.
Boxes are `x,y,w,h` in CSS px. Screenshots: `evidence/real-*.png`, `evidence/local-*.png`, Figma: `evidence/figma-*.png`.

## Live site markup (relevant classes)

- Shell: `relative h-screen w-screen overflow-hidden bg-[#00101a]`; key visual = div `bg cover, position right center`; left gradient same as Figma; bottom gradient `h-100 bottom-0 linear-gradient(0deg,#00101A 0%,rgba(0,19,32,0) 70%)`.
- Container (header + main): `w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0` (1224px).
- Main: `flex-1 flex flex-col justify-center`; stack `gap-10 2xl:gap-30`.
- ROOT FURTHER img: `max-h-30 sm:max-h-40 lg:max-h-[unset] w-auto lg:w-112.75`.
- Text: `text-[20px] font-normal leading-10 tracking-[0.5px] sm:max-w-120`, "SAA 2025" bold span, `<br>`.
- Button: `min-w-74.25 h-15 px-6 py-4 gap-2 bg #FFEA9E hover:bg-[#fff8e1] rounded-lg disabled:opacity-50`, label `text-[22px] font-normal leading-7`.
- Lang trigger: `flex items-center gap-1 px-4 py-4 rounded-sm hover:bg-[#FFEA9E1A]`, flag svg 20×15 in 24 box, label `font-medium tracking-[0.15px]`, chevron flips when open.
- Lang menu: `absolute right-0 top-full mt-2 w-32 p-1.5 gap-y-1 bg #101417 border #998c5f rounded-lg shadow-lg`; items `px-4 py-3 rounded-sm gap-2`, selected `#ffea9e33`, hover `#ffea9e1a`.
- Footer: `absolute bottom-0 py-6 border-t #2e3940`, text Montserrat 400 16/24.

## Breakpoint boxes

| vw | element | live | local |
|----|---------|------|-------|
| 375 | logo | 12,16 | 16,16 |
| 375 | ROOT FURTHER | 12,224,271×120 | 16,241,240×106 |
| 375 | text | 12,384 w351 20/40 | 32,388 w327 16/32 (pl-4) |
| 375 | button | 12,528,350×60 | 32,508,265×60 (label 18px) |
| 375 | footer | h73, text 16 | h91, text 14 |
| 768 | logo | 32 | 48 |
| 768 | ROOT FURTHER | 362×160 | 451×200 |
| 1024 | logo / hero | 32 / 451×199 | 48 / 451×200 |
| 1440 | logo / hero / text | 108 / 108 / 108 | 144 / 144 / 160 (= Figma) |
| 1920 | logo / hero | 348 (centered) | 144 (left-pinned) |

## Figma vs local (desktop 1440)

Local matches Figma `GzbNeVGJHz` at 1440 (header 12/144 padding, hero 144,·,451×200, text 160 700 20/40, button 305×60 label 700 22, footer 91 Montserrat Alternates 700).
Local language menu does NOT match Figma `hUyaaugye2`: local `bg #0B0F12 border #2E3940 p-1 gap-1 items px-3 py-3 selected white/10`, Figma `bg #00070C border #998C5F p-6px no-gap items p-16 h56 selected rgba(255,234,158,.2) r2`.
