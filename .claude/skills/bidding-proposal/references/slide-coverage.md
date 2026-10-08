# Slide Coverage — which template slide each section fills

Referenced from `SKILL.md`. The template is a slide POOL, not a skeleton:
only sections present in the profile produce slides.

The SVN Proposal template (`SVN Proposal Menu.pptx`, 72 slides) is a **slide pool, not a fixed skeleton** — it fills 17 content slides, but the *output* deck is content-driven: only sections present in the profile produce slides. Cover (slide 1) and agenda (slide 2) are always kept; a chapter divider (e.g. "System Overview", "Estimated Assumptions") is kept only when its chapter has ≥1 filled slide. Empty sections produce no slide at all (and no orphan divider) — the old behavior of leaving a blank slide for a missing section is gone. The same applies *within* a section that spans several template slides (`benefits[0:2]`/`[2:4]`, `assumptions[0:5]`/`[5:8]`/`[8:9]`): a surplus slide the fill pass never wrote to is dropped rather than shipped with the template's own sample content — only the section's first slide is guaranteed to survive. Slide order follows the profile markdown's `## heading` order (falls back to the canonical section order below if that's unavailable). The mapping from profile section → slide(s) lives in `scripts/lib/templates/svn.py` (`SlideRoleConfig` for filling, `SECTION_TO_SLIDES` + `CHAPTER_DIVIDERS` for picking). To add a new slide, declare a new `SlideRoleConfig` plus its `SECTION_TO_SLIDES` entry (and `CHAPTER_DIVIDERS` entry if it belongs to an existing chapter) in `svn.py` — no changes to gen-md or gen-slide are needed.

| Slide | Section consumed | Layout |
|-------|------------------|--------|
| 1 | cover (optional) | Client company name + date, filled in place |
| 2 | agenda (optional) | Chapter list + 費用 sub-items, filled in place |
| 4 | project_background | Current issues + objectives |
| 5 | features | Description + table |
| 6 | nfr_overview | Description + table |
| 8 | screen_flow | Image overlay |
| 10, 11 | business_process | Categories + before/after |
| 12, 13 | benefits[0:2], benefits[2:4] | 2 title+body each |
| 15, 16 | approach_comparison (as points) | 3 / 4 numbered point cards — whichever holds every point |
| 21 | approach_comparison (as a matrix) | Table |
| 23, 24, 25 | assumptions[0:5], [5:8], [8:9] | 2-col tables (both cols: the document's own row labels) |
| — | any schedule table | drawn as a timeline chart in slides 42/46's design (`lib/timeline_data.py` reads it, `lib/timeline_layouts.py` composes it, `lib/timeline_shapes.py` draws it) rather than as a grid |
| 33 | infrastructure | Table |
| 34 | software_stack | Table |
| 35 | nfr_sections | 4 title+body pairs |
| 36 | nfr_detailed | Table |
| 38 | — (donor only) | 6 labelled rows, lent to appendix chapters |
| 43 | schedule | Text + Gantt image |

**Appendix chapters borrow these designs rather than being drawn from scratch.**
A chapter that matches no section still gets a real slide: a fenced drawing
becomes a picture, a table stays a table (a schedule table becomes a timeline
chart), and a chapter of 3–6 labelled points borrows template slide 15, 16 or 38
— cloned and filled through that slide's own roles, then retitled. A donor is
taken only when its capacity covers every point, and the tightest fit wins; with
no donor the drawn layouts in `lib/extra_slide_layouts.py` / `lib/list_layouts.py`
take over, choosing between row cards, a card grid and a panel by the list's own
shape. Registry: `DONOR_SLIDES` in `svn.py`. Every donor must have all of its text
shapes bound to a role — `verify-template-contract.py` fails the build otherwise,
because an unbound shape ships the template's sample sentence about another
client. Full rules: `supplied-document.md` §2 (this file lives beside it).

---

