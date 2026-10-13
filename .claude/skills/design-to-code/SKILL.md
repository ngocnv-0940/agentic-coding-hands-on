---
name: tkm:design-to-code
description: Turn a design, screenshot, or video into frontend code that honors the original — web components, 3D scenes, fast prototypes, immersive interfaces. Faithful to the source, refined in every detail, never papered over with generic defaults.
license: Complete terms in LICENSE.txt
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
module: design-frontend
triggers: ["redesign this", "make it look like", "replicate UI", "from screenshot", "from Figma", "pixel-perfect", "convert design to code", "thiết kế lại"]
---

Turn a visual design into frontend code fit to ship: faithful to the source, exact in
measurement, and free of the tells that read as AI slop.

The counter-steering below — the Dials and the Anti-Patterns table — is the load-bearing part
of this skill. It exists because a capable model has strong defaults of its own, and those
defaults are the thing the work has to be steered off.

## Workflow Selection

The kind of input you start with decides the path you take:

| Input | Workflow | Reference |
|-------|----------|-----------|
| Screenshot | Replicate exactly | `./references/workflow-screenshot.md` |
| Video | Replicate with animations | `./references/workflow-video.md` |
| Screenshot/Video (describe only) | Document for devs | `./references/workflow-describe.md` |
| 3D/WebGL request | Three.js immersive | `./references/workflow-3d.md` |
| Quick task | Rapid implementation | `./references/workflow-quick.md` |
| Complex/award-quality | Full immersive | `./references/workflow-immersive.md` |
| Existing project upgrade | Redesign Audit | `./references/redesign-audit-checklist.md` |
| From scratch | Design Thinking below | - |

**Every path starts the same way**: bring up the `tkm:design-ui` skill FIRST for its design intelligence.

**Precedence:** Where the anti-slop rules below clash with a `tkm:design-ui` recommendation (Inter font, AI Purple palette, Lucide-only icons, and the like), take the alternative from `./references/anti-slop-rules.md` — unless the user asked for the conflicting choice on purpose.

## Design Dials

Three knobs steer the design decisions. Set them at the start of a session, or let the user turn them mid-conversation:

| Dial | Default | Range | Low (1-3) | High (8-10) |
|------|---------|-------|-----------|-------------|
| `DESIGN_VARIANCE` | 8 | 1-10 | Perfect symmetry, centered layouts, equal grids | Asymmetric, masonry, massive empty zones, fractional CSS Grid |
| `MOTION_INTENSITY` | 6 | 1-10 | CSS hover/active states only | Framer Motion scroll reveals, spring physics, perpetual micro-animations |
| `VISUAL_DENSITY` | 4 | 1-10 | Art gallery — huge whitespace, expensive/clean | Cockpit — tiny paddings, 1px dividers, monospace numbers everywhere |

**How they bite:** each setting triggers concrete rules. Above `DESIGN_VARIANCE` 4, centered heroes are worn out — push to split-screen or left-aligned instead. Above `MOTION_INTENSITY` 5, work in perpetual micro-animations. Above `VISUAL_DENSITY` 7, drop the generic cards and lean on spacing and dividers.

For a dial-driven SaaS dashboard build, see `./references/bento-motion-engine.md`.

## Before the first line of code

Commit to one direction and execute it cleanly. Four questions settle it: what the interface is
for and who sits in front of it · which tone it commits to, taken to an extreme rather than
hedged · the technical givens (framework, performance budget, accessibility) · and the one
thing a person walks away remembering.

Loud maximalism and quiet minimalism both work. What separates good from forgettable is intent,
not volume — and the code should match the ambition of the vision, elaborate where the design is
elaborate, restrained where it is refined.

Two rules survive from this into every build: no two designs should land in the same place, and
every generation must not drift toward the same safe pick.

## Asset & Analysis References

| Task | Reference |
|------|-----------|
| Analyze quality | `./references/visual-analysis-overview.md` |
| Extract guidelines | `./references/design-extraction-overview.md` |
| Optimization | `./references/technical-overview.md` |
| Animations | `./references/animejs.md` |
| Magic UI (80+ components) | `./references/magicui-components.md` |
| Anti-slop forbidden patterns | `./references/anti-slop-rules.md` |
| Redesign audit checklist | `./references/redesign-audit-checklist.md` |
| Premium design patterns | `./references/premium-design-patterns.md` |
| Performance guardrails | `./references/performance-guardrails.md` |
| Bento motion engine (SaaS) | `./references/bento-motion-engine.md` |

## Anti-Patterns (AI Slop)

These are the LLM reflexes — reach for the alternative. Full rules: `./references/anti-slop-rules.md`

**Typography** — Steer off Inter/Roboto/Arial. Reach for: trending Google Fonts with Vietnamese glyph coverage, `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi` (hunt for the best fit).

**Font size** — Keep input fields above 16px ALWAYS, so mobile browsers don't zoom on focus.

**Color** — Steer off the AI purple/blue gradient look, pure `#000000`, and oversaturated accents. Build on neutral bases with one considered accent.

**Layout** — Steer off 3-column equal card rows, centered heroes at high variance, and `h-screen`. Reach for asymmetric grids, split-screen, `min-h-[100dvh]`. Design mobile-first, not as an afterthought.

**Content** — Steer off "John Doe", "Acme Corp", round numbers, and the AI copy tics ("Elevate", "Seamless", "Unleash"). Use real-sounding names, messy real-world data, and plain specific language.

**Effects** — Steer off neon/outer glows, custom cursors, and gradient text on headers (unless asked). Reach for tinted inner shadows and spring physics.

**Components** — Steer off default unstyled shadcn, Lucide-only icon sets, and the generic card-border-shadow at high density. Always customize; try Phosphor/Heroicons; let spacing do the work cards were doing.

**Quick check:** Run the "AI Tells" list in `./references/anti-slop-rules.md` before you hand anything over.

**Performance:** Animation and blur rules live in `./references/performance-guardrails.md`.
