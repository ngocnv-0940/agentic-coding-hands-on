---
name: tkm:design-ui
description: "UI/UX design intelligence — 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, 25 chart types, searchable from a local dataset. Stack-specific guidance currently covers React Native only. Activate before designing or building any interface."
metadata:
  author: takumi-agent-kit
  version: "1.1.0"
module: design-frontend
triggers: ["design from scratch", "choose colors", "pick fonts", "design system", "what style should", "UX guidelines", "create UI from idea"]
---

# Design UI

Look is structure, not garnish. A local dataset backs every call: 50+ styles, 161 palettes,
57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, 25 chart types.

## Invariants

1. **Recommend only what the dataset returns.** Every style, palette, font pairing and product
   pattern named in an answer must have come back from `search.py`. A plausible-sounding font
   name that is not in `google-fonts.csv` is a fabrication, and it is the failure this skill
   exists to prevent — the data is here precisely because the model's own recall is not.
2. **`--design-system` first, always.** It runs the domains together and applies the reasoning
   rules; a hand-assembled set of separate domain searches skips that step.
3. **Stack guidance covers React Native only.** One stack file exists. For any other stack,
   give the stack-agnostic design system and say plainly that stack-specific rules are not
   available here, rather than inventing them.
4. **Reach for the skill on UI structure, visual calls, interaction patterns and experience
   QC.** Skip it for copy edits, backend work, and changes with no visual surface.

## Rule Categories by Priority

*Reference for humans and AI alike: work the priorities 1→10 to decide which category deserves attention first; reach for `--domain <Domain>` to pull the details when you need them. The scripts ignore this table.*

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, Reserve space (CLS &lt; 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic color tokens | Text &lt; 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | `ux` | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Quick Reference

Full per-category rule catalogs (Accessibility, Touch, Performance, Style, Layout, Typography, Animation, Forms, Navigation, Charts): `references/ux-quick-reference.md`

Needs `python3` on PATH.

## How to Use This Skill

Reach for the skill when a request lands in any of these lanes:

| Scenario | Trigger Examples | Start From |
|----------|-----------------|------------|
| **New project / page** | "Build a landing page", "Build a dashboard" | Step 1 → Step 2 (design system) |
| **New component** | "Create a pricing card", "Add a modal" | Step 3 (domain search: style, ux) |
| **Choose style / color / font** | "What style fits a fintech app?", "Recommend a color palette" | Step 2 (design system) |
| **Review existing UI** | "Review this page for UX issues", "Check accessibility" | Quick Reference checklist above |
| **Fix a UI bug** | "Button hover is broken", "Layout shifts on load" | Quick Reference → relevant section |
| **Improve / optimize** | "Make this faster", "Improve mobile experience" | Step 3 (domain search: ux, react) |
| **Implement dark mode** | "Add dark mode support" | Step 3 (domain: style "dark mode") |
| **Add charts / data viz** | "Add an analytics dashboard chart" | Step 3 (domain: chart) |
| **Stack best practices** | "React Native list performance", "RN navigation" | Step 4 (stack search — React Native only) |

Work the bench in this order:

### Step 1: Analyze User Requirements

Pull the key facts out of the request:
- **Product type**: Entertainment (social, video, music, gaming), Tool (scanner, editor, converter), Productivity (task manager, notes, calendar), or hybrid
- **Target audience**: C-end consumer users; weigh age group and usage context (commute, leisure, work)
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: React Native (this project's only tech stack)

### Step 2: Generate Design System (REQUIRED)

**Open with `--design-system` every time** — it returns full recommendations with the reasoning attached:

```bash
python3 skills/design-ui/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

What it does:
1. Runs the domains in parallel (product, style, color, landing, typography)
2. Feeds the matches through the reasoning rules in `ui-reasoning.csv` to pick the best fit
3. Hands back the whole design system: pattern, style, colors, typography, effects
4. Names the anti-patterns to stay clear of

**Example:**
```bash
python3 skills/design-ui/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)

To keep the design system around for **hierarchical retrieval across sessions**, tack on `--persist`:

```bash
python3 skills/design-ui/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

That lays down:
- `design-system/MASTER.md` — the global source of truth, holding every design rule
- `design-system/pages/` — the folder where page-specific overrides go

**With a page-specific override:**
```bash
python3 skills/design-ui/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

That adds:
- `design-system/pages/dashboard.md` — where this page parts ways with the Master

**How hierarchical retrieval works:**
1. Building a given page (say "Checkout"), look first at `design-system/pages/checkout.md`
2. If that page file is there, its rules **win over** the Master
3. If it isn't, the rules in `design-system/MASTER.md` stand alone

**Context-aware retrieval prompt:**
```
I am building the [Page Name] page. Please read design-system/MASTER.md.
Also check if design-system/pages/[page-name].md exists.
If the page file exists, prioritize its rules.
If not, use the Master rules exclusively.
Now, generate the code...
```

### Step 3: Supplement with Detailed Searches (as needed)

Once the design system is in hand, drill into a domain whenever you need more detail:

```bash
python3 skills/design-ui/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

**When a detailed search earns its place:**

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `--domain product "entertainment social"` |
| More style options | `style` | `--domain style "glassmorphism dark"` |
| Color palettes | `color` | `--domain color "entertainment vibrant"` |
| Font pairings | `typography` | `--domain typography "playful modern"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Alternative fonts | `typography` | `--domain typography "elegant luxury"` |
| Individual Google Fonts | `google-fonts` | `--domain google-fonts "sans serif popular variable"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |
| React Native perf | `react` | `--domain react "rerender memo list"` |
| App interface a11y | `web` | `--domain web "accessibilityLabel touch safe-areas"` |
| AI prompt / CSS keywords | `prompt` | `--domain prompt "minimalism"` |

### Step 4: Stack Guidelines (React Native)

Pull the React Native implementation-specific best practices:

```bash
python3 skills/design-ui/scripts/search.py "<keyword>" --stack react-native
```

---

## Search Reference

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| `product` | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style` | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings, Google Fonts | elegant, playful, professional, modern |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech, service |
| `landing` | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing, social-proof |
| `chart` | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| `ux` | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| `google-fonts` | Individual Google Fonts lookup | sans serif, monospace, japanese, variable font, popular |
| `react` | React/Next.js performance | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | App interface guidelines (iOS/Android/React Native) | accessibilityLabel, touch targets, safe areas, Dynamic Type |
| `prompt` | AI prompts, CSS keywords | (style name) |

### Available Stacks

| Stack | Focus |
|-------|-------|
| `react-native` | Components, Navigation, Lists |

---

## Output Formats

`--design-system` writes out in two shapes:

```bash
# ASCII box (default) - best for terminal display
python3 skills/design-ui/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 skills/design-ui/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

### Query Strategy

- Stack the keywords **across dimensions** — product + industry + tone + density: `"entertainment social vibrant content-dense"`, not a lone `"app"`
- Rephrase the same intent a few ways: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Lead with `--design-system` for the full picture, then `--domain` to dig into any dimension you're unsure of
- Always pass `--stack react-native` for implementation-specific guidance

### Common Sticking Points

| Problem | What to Do |
|---------|------------|
| Can't decide on style/color | Re-run `--design-system` with different keywords |
| Dark mode contrast issues | Quick Reference §6: `color-dark-mode` + `color-accessible-pairs` |
| Animations feel unnatural | Quick Reference §7: `spring-physics` + `easing` + `exit-faster-than-enter` |
| Form UX is poor | Quick Reference §8: `inline-validation` + `error-clarity` + `focus-management` |
| Navigation feels confusing | Quick Reference §9: `nav-hierarchy` + `bottom-nav-limit` + `back-behavior` |
| Layout breaks on small screens | Quick Reference §5: `mobile-first` + `breakpoint-consistency` |
| Performance / jank | Quick Reference §3: `virtualize-lists` + `main-thread-budget` + `debounce-throttle` |

Per-category rule catalogs live in `references/ux-quick-reference.md`; pull them with
`--domain ux` when a specific rule is needed.

## Pre-Delivery Checklist

Walk this before the UI code leaves your hands:
Scope notice: this checklist covers App UI (iOS/Android/React Native/Flutter).

### Visual Quality
- [ ] No emoji standing in for icons (SVG instead)
- [ ] Every icon drawn from one consistent family and style
- [ ] Official brand assets, right proportions, right clear space
- [ ] Pressed-state visuals hold the layout bounds — no shift, no jitter
- [ ] Semantic theme tokens used throughout — no per-screen hardcoded colors

### Interaction
- [ ] Every tappable element answers a press (ripple/opacity/elevation)
- [ ] Touch targets clear the minimum (>=44x44pt iOS, >=48x48dp Android)
- [ ] Micro-interactions land in 150-300ms with native-feeling easing
- [ ] Disabled states read clearly and don't respond
- [ ] Screen-reader focus order tracks visual order; interactive labels are descriptive
- [ ] Gesture regions steer clear of nested/conflicting interactions (tap/drag/back-swipe)

### Light/Dark Mode
- [ ] Primary text >=4.5:1 in both light and dark mode
- [ ] Secondary text >=3:1 in both light and dark mode
- [ ] Dividers/borders and interaction states stay distinct in both modes
- [ ] Modal/drawer scrim opaque enough to keep the foreground legible (typically 40-60% black)
- [ ] Both themes actually tested — neither inferred from the other

### Layout
- [ ] Safe areas honored for headers, tab bars, and bottom CTA bars
- [ ] No scroll content hiding behind fixed/sticky bars
- [ ] Checked on small phone, large phone, and tablet (portrait + landscape)
- [ ] Horizontal insets/gutters adapt by device size and orientation
- [ ] 4/8dp spacing rhythm holds across component, section, and page levels
- [ ] Long-form text measure stays readable on larger devices (no edge-to-edge paragraphs)

### Accessibility
- [ ] Every meaningful image/icon carries an accessibility label
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is never the lone indicator
- [ ] Reduced motion and dynamic text size both work without breaking the layout
- [ ] Accessibility traits/roles/states (selected, disabled, expanded) announced correctly