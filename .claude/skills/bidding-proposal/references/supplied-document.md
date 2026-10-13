# How a supplied document is read

Reference for Step 0.0 of `SKILL.md` — the path where the user hands over the
source markdown and Clio is never touched. Read this when you need to know what
`gen-slide.py` will do with a document before deciding whether to reshape it.

**The short version: don't reshape it.** Everything below exists to explain why
that is safe.

`gen-md.py` (Step A) is an optional convenience, not a requirement:
`outputs/project_content_{id}.md` may be hand-written, or copied straight out of
a proposal, in any structure or language, without ever running Step A.
`gen-slide.py` (Step B) is decoupled from Step A's schema on purpose, and reads a
source document at two levels before falling back to a generic slide.

## 0. The `sections:` mapping — how a chapter reaches its slide

The alias table in §1 only knows the wordings someone has already met. A proposal
phrased its own way — `導入効果` rather than `システム導入のメリット`, `構成案`
rather than `システム構成図の提案` — matches nothing in it, and every chapter
falls through to an appendix slide. Measured: an ordinary Japanese proposal with
the same seven-chapter shape as the reference documents reached **0 of the 17**
bespoke template slides.

So the agent that reads the document at Step 0.0 records what it found, in front
matter prepended to the profile markdown:

```markdown
---
sections:
  "1. 本システムの全体像": container
  "1.1 現行業務の課題と狙い": project_background
  "1.2 提供機能の一覧": features
  "2. 導入効果": benefits
  "7. お見積り": cost
---
```

Resolution order per heading:

1. the mapping, by the heading's exact spelling
2. the mapping, by its normalized form (numbering and `— gloss` stripped)
3. the alias table (§1)
4. container unwrap, then an appendix slide (§2)

`container` marks a chapter whose own `###` subsections are the real sections;
the chapter itself produces no slide — but it does name the chapter: its
subsections share ONE divider (the first subsection's), retitled after the
container heading. `"5. 開発スケジュールおよび成果物": container` over
`### 全体スケジュール案` + `### 提出物` therefore yields one divider, then the
schedule slide, then the deliverables slide, in that order. A section with a
divider but no content slide — `"6. プロジェクト体制": team` — keeps its divider
and takes `--extra-slides` entries anchored to `team` as its body
(`generate-content-schedule-team.md`). A value that is not a valid section key
**stops the run** — a typo would otherwise look identical to a mapping that
worked.

### A target may name one BOX of a section

A template slide can carry two boxes with different meanings — slide 4 heads its
columns `現状の課題` and `目的・実現したいこと`. A proposal routinely writes those
as two separate chapters, and a section-level target cannot say which chapter
fills which box: the first to resolve claims the whole section and the
duplicate-section guard locks the second out.

So a target may also be `section.field`, the same dotted convention
`ShapeRole.source_path` uses in `templates/svn.py`:

| Field path | The box it names |
|---|---|
| `project_background.current_issues` | slide 4, left column |
| `project_background.objectives` | slide 4, right column |
| `features.description` | slide 5, lead-in prose |
| `nfr_overview.description` | slide 6, lead-in prose |
| `schedule.description` | slide 43, lead-in prose |

Structural fields (`table`, `rows`, `image_path`) are deliberately NOT
addressable — they hold a grid or a path, and a heading pointed at one would put
raw markdown where a table belongs.

`appendix` is the third sentinel, alongside `container`: it stands a chapter down
so a sibling can claim the box. First-occupant-wins is decided by document order,
and the chapter that should fill a slide often arrives second — §1.1 Project
Background precedes §1.2 Current Challenges and would otherwise lock it out.
Only the author of the front matter can know which was meant, so `appendix` is
absent from the alias table by design.

A chapter that is nothing but a table still reaches a prose box as text: its rows
are flattened to `first column — rest`, one per line. Its markdown pipes never
reach the deck.

## 0b. `slides:` — copy for a box the chapter outgrows

Front matter also switches on content SHAPING, which is off for any document
without it (so `gen-md.py`'s own markdown is untouched):

- list items are promoted to paragraphs before a prose box reads them, so a
  chapter's numbered points survive instead of being dropped by `parse_prose` in
  favour of the prose around them;
- text too long for its box is reflowed to fit — one line per point, headline
  only if it must — instead of being poured in and cut mid-chapter.

Every reshape is reported, and the report never rounds a loss up to a success:

```
- Role 'current_issues': reshaped to its box — all 6 point(s) kept,
  elaborations trimmed to headlines (774 -> 265 chars)
- Role 'benefits': condensed to its box — 4 of 6 point(s) kept, headline only;
  2 left off this slide entirely
```

When a line says points were left off, the agent may write the box's copy itself:

```markdown
---
slides:
  project_background.objectives:
    - All ring sensor data received without loss
    - BLE stable under realistic daily use, including background sync
  features.description: One sentence, written inline
---
```

It takes the same field paths, and it beats everything the parser derived.

**This is copy DERIVED from the document, not new claims about the project.**
Every point must be something the chapter already says, said shorter. The rule in
§1 — never reshape the document — is unchanged: `slides:` adds a note about the
document beside it, and leaves the document alone.

The mapping is metadata *about* the document. It is the only thing that may be
added to a supplied proposal; §1's "never reshape it" rule governs everything
else. When the cover comes out wrong the fix is a command-line flag, never an
edit: `--cover-company` / `--cover-date` (see `cover-and-agenda.md`).

`gen-slide.py` prints the tally: `Sections resolved: 9/9 chapters (8 mapping,
1 alias, 0 appendix)`. Below half, it warns — the deck is about to be mostly
generic slides wearing SVN chrome.

## 1. Headings are matched by meaning, not by exact spelling

A `##` heading is resolved through `section_aliases.py`, which accepts gen-md.py's
English schema names AND the chapter titles a real proposal uses. It strips
markdown escapes, chapter numbering and the `JP — English gloss` pattern before
looking up, so all of these reach the same `features` section and fill the same
template slide:

```
## Features        ### 1.2 機能一覧        ## 機能一覧表        ## 1\. 機能一覧 — Features
```

Resolution has two tiers. First the alias table, exact. Then, for a wording
nobody has met yet, a small set of keyword rules — the WORD a chapter is about:

```
## 5. Estimation Assumptions      -> assumptions   (assumption / prerequisite / 前提条件)
## 2. Benefits of the Proposal    -> benefits      (benefit / advantage / メリット)
## 1.5 Non-Functional Requirements -> nfr_overview (non-functional requirements / 非機能要件)
```

The keyword tier refuses to guess in two situations, and both fall back to §2's
appendix route rather than to the nearest slide:

* **the heading names two chapters at once** — `9.3 Infrastructure cost` is a cost
  table about infrastructure, and picking one of the two is worse than picking
  neither;
* **the word is only decisive in company** — `infrastructure` alone is as much at
  home in a cost breakdown as in an architecture chapter, so only the
  unambiguous `system architecture` spelling resolves.

Why this matters more than styling: a chapter that resolves to nothing is not
merely unstyled, it is taken APART. `5. Estimation Assumptions` used to resolve to
nothing (the table listed the template divider's `Estimated Assumptions`), so the
parser read the chapter as a container — `5.8 Infrastructure` claimed the System
Architecture slides on the way past, and the other eight subsections each became
an appendix slide. Nine rows of a grid the template had drawn for them turned
into eight loose slides.

A chapter that is really a CONTAINER — `## 1. システムの概要 — System Overview`,
whose own `### 1.1 プロジェクト背景・目的` and `### 1.2 機能一覧` are the actual
sections — is unwrapped: the subsections become sections, the chapter itself
produces no slide. A chapter whose OWN heading resolves is never unwrapped, which
is what keeps a subsection from claiming a section its chapter owns.

Sections whose content sits loose in the block (prose and a table together, with
no `### Description` / `### Feature Table` to look under) are read anyway. Markdown
inline markup is rendered as plain text on the way in: `[label](url)` → `label`,
`**bold**` → `bold`, escapes removed. `Sun*` survives — it is a brand name, not
emphasis.

**Consequence for the agent: never rewrite a supplied document to "fit the
schema". It already fits.** Adding a heading, promoting a `###` to `##`, or
splitting a chapter does not help the parser — it invents content the user never
wrote and pushes real sections out onto appendix slides.

Tables are copied column for column AND cell for cell: the grid of the template
slide is reshaped to the markdown's column count, never the other way round, and
an empty cell stays an empty cell — `| | Total | | 36 |` keeps `Total` under its
own heading instead of sliding two columns left.

The grid's width is then shared out by what the data holds: every column gets at
least its longest WORD (so nothing is broken mid-syllable) and the rest goes to
the columns holding sentences. A column of two-digit numbers keeps two digits'
worth.

A SCHEDULE table is not drawn as a table at all — it is drawn as the chart it
describes, in the visual language template slides 42 (Milestone and KPIs) and 46
(System development schedule) are built from: a month axis, a red band of phase
arrows, lanes of chips, dated markers, the grey panel of outputs.

| The table says | It is drawn as |
|---|---|
| a column of months (`Phase \| Duration \| Months \| Focus`) | a phase band, with each phase's focus under its own months |
| month HEADERS (`Position \| 2026/05 \| 2026/06 \| …`) | one lane per role, the effort in each month, a totals band |
| a column of dates (`Milestone \| Target date \| Exit criterion`) | dated markers on a timeline, criteria listed in a panel |

Anything else keeps its grid, and the refusals are strict: all the cells of a
column have to parse (one date in a notes column is a coincidence), two months
are not a matrix, and one dated row is not a timeline. Past eighteen months the
axis groups itself into quarters. See `lib/timeline_data.py` for the reading,
`lib/timeline_layouts.py` for the composition and `lib/timeline_shapes.py` for
the drawn vocabulary (the red, the chip, the dotted rule, the dated dot).

A table too long for one slide is PAGED, not cut: cells keep their full text, the
rows are spread evenly over the pages they need (never five pages full and a
sixth holding one row), each page's label says which page it is — `Full feature
breakdown (2/7)` — and the chapter's lead-in paragraph appears on the first page
only. Only a grid pinned to one slide by design (the 前提条件 summaries, whose
row labels come from the template) trims a cell to its share of the height.

## 2. Anything still unrecognized becomes a slide, never a deletion

Any `##` heading that matches no section name and unwraps to no known subsection
is **never silently dropped**. `profile_parser.py` classifies its content and
auto-routes it to one of the generic layouts in `extra_slide_layouts.py` — no
`## extra:` prefix or hand-authored JSON needed:

| Content shape under the heading | Layout chosen |
|---|---|
| A fenced block that is a DRAWING (box characters / arrows) | `diagram` — the block is drawn as a picture, the chapter's prose above it as a lead-in |
| A markdown table | `table` — a real grid, or a timeline chart when the table describes a schedule |
| Exactly 2 `###` subsections | `comparison_2` |
| 3–6 `###` subsections | `numbered_points` — borrows a template design when one fits (see below) |
| A bulleted/numbered list | `bullets` |
| 1 or 7+ `###` subsections | `bullets` (one bullet per subsection — outside `comparison_2`/`numbered_points`' hard caps, so never truncates) |
| Short plain paragraph (≤280 chars, no blank-line break) | `hero` |
| Anything else | `bullets` |

A fence the author LABELLED — ```` ```bash ````, ```` ```yaml ````, ```` ```sql ````
— is a listing, never a drawing, whatever characters it holds: a shell pipeline
carries enough `|` to look like box art to anything that only counts characters,
and a chapter misread that way would lose its table to a picture of its own code.
Only an unlabelled fence (or one labelled `text` / `ascii` / `diagram`) is even
considered, and ASCII art must still show a `+---` corner run to qualify.

A chapter is never reduced to one shape: when a diagram or a table takes the
slide, the chapter's OTHER tables each get a slide of their own, and a table
chapter's tableless subsections get one too. Nothing leaves the deck silently.

The slide is inserted right after the last *recognized* section seen before it in
the source file (or at the end of the deck if none), and carries an `Appendix`
breadcrumb so a reader can tell it from the bespoke template slides.

### An appendix chapter may borrow a real template design

Drawing a slide from primitives always loses to a design the deck already ships.
So before falling back to a drawn layout, a chapter of 3–6 labelled points is
offered the template slides built for exactly that shape — 15 and 16 (the
提案の要諦 point cards, 3 and 4 slots) and 38 (想定作成物, six labelled rows). The
donor is cloned and filled through the same roles that fill it from a profile,
then retitled after the borrowing chapter.

The rules are deliberately narrow, and all three exist to stop a prettier slide
from saying less than a plainer one:

* a donor is taken only when its capacity covers EVERY item — a four-card design
  handed five points would drop one;
* the TIGHTEST fitting design wins, not the first — three points in the six-row
  design read as a half-finished slide;
* no donor fits → the drawn layout stays. Borrowing can upgrade a slide, never
  break one.

A plain list with no donor is still not one shape: `bullets` picks between row
cards (labelled items), a two- or three-column card grid (short items) and a
single panel (prose), each measured off slides 35 and 38.

This runs automatically, every time — no flag required. It composes with
`--extra-slides`: manually-authored entries are appended after the auto-routed
ones, not replaced by them.

## 3. The deck speaks the document's language

The template is a Japanese deck: every slide is headed `<chapter>  ｜  <section>`
in the wording of the proposal it was authored for, and its column headers and
captions are Japanese labels. Rendering an English or Vietnamese proposal
through it used to produce a bilingual result — the document's own body copy
under someone else's Japanese headings.

Three passes fix that, and none of them needs a flag:

1. **Slide titles come from the source's own headings.** The heading that filled
   a section, numbering stripped, becomes that slide's breadcrumb tail and the
   title below it — `### 1.1. Project Background` heads its slide
   `System Overview  ｜  Project Background`. This runs for every document,
   Japanese included: the source's wording beats the template's in any language.
2. **Chapter dividers come from the AGENDA** (see `cover-and-agenda.md`). A
   divider no agenda line names keeps its own English line on a non-Japanese
   deck, rather than standing as the only Japanese heading left.
3. **Fixed chrome is Englished on a non-Japanese deck** — the labels no heading
   can name (`現状の課題` → `Current Issues`, `導入前` → `Before`), from
   `TEMPLATE_CHROME_EN` in `svn.py`. A Japanese document never consults it.

The language is decided by the presence of kana in the document — not by a flag,
and not by the 株式会社 in the Sun* footer.

**Known gap:** a template slide the fill pass never writes to keeps its sample
SENTENCES, which are Japanese and belong to another client's proposal. Those are
not translated — a fluent English sentence this proposal never wrote is worse
than a visibly foreign one. Review them in QA (step 5) and cut them.

## 4. Reading the WARNING list

`gen-slide.py`'s stdout prints a `WARNING` per auto-routed section (heading,
chosen layout, anchor). **Always review the rendered PPTX before handing it
over** — the heuristic can't guarantee a generic layout looks as polished as the
17 bespoke slide designs.

Read that list as a report, not as noise. Each line is one chapter of the source
that found no home among the template slides:

- **A handful is normal.** A proposal always carries material the SVN template
  has no slide for — revision summaries, cost tables, closing notes.
- **A long list on a document whose chapters *should* map** means something
  upstream mangled the headings. Check that Step 0.0 really copied the file
  verbatim before blaming the parser: a rewritten heading, a `###` promoted to
  `##`, or one chapter split into several will each show up here.
