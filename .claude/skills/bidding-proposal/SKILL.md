---
name: tkm:bidding-proposal
category: presales
roles: [pm]
description: "Generate an SVN Proposal PPTX from either a markdown document the user supplies (attached proposal / profile md — used verbatim, Clio never touched) or, when none is supplied, from the Clio Knowledge Graph. Auto-detects the source first, then whether to run Step A (gen md) before Step B (gen slide). Explicit flags: `--gen md` or `--gen slide`. No flag needed — say 'gen slide for project X', or 'tạo slide từ file md đính kèm', and the skill handles the rest."
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - mcp__clio__clio_get_assets_download_url
  - mcp__clio__clio_get_assets_upload_url
  - mcp__clio__clio_finalize_assets_upload
  - mcp__clio__clio_get_artifacts_upload_url
  - mcp__clio__clio_query
argument-hint: "[--gen md|slide] [--project-id ID] [--extra-slides PATH.json]"
metadata:
  author: takumi-agent-kit
  version: "3.4.0"
---

# Slide Proposal — SVN Proposal Generator (2-step pipeline)

This skill runs in two sequential steps, with **smart auto-routing** when no step is specified:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Auto** | No flag / "gen slide" / "tạo slide" | Resolve the source document (Step 0.0) → if it is a document the user supplied, go straight to Step B; else run Step A then Step B |
| **Step A** | `--gen md` | Check Clio for existing profile → download all assets + merge OR query KG + generate fresh → output local markdown for review |
| **Step B** | `--gen slide` | Check for unresolved conflicts → render SVN PPTX → upload to Clio **only when the content came from Clio** |
| **Optional** | `--extra-slides` | AI-generated extra slides from JSON to be included when running Step B |

After Step A, the user may review and edit the markdown before Step B runs. In auto mode the two steps execute back-to-back without interruption.

The profile markdown is **domain-organized**, not slide-organized — adding/removing slides only requires changing the template config, not the agent workflow.

### Two ways in — pick one, never both

The deck's content comes from exactly ONE source, decided at Step 0.0 before anything else runs:

| Source | When | Path |
|--------|------|------|
| **A document the user supplies** | They attach, paste a path to, or point at a proposal/profile markdown | **Step B only**. Clio never queried, nothing uploaded. |
| **Clio Knowledge Graph** | No document supplied | **Step A → Step B**. |

> **A supplied document always wins, and is never mixed with the other source.**
> That file *is* the proposal — never "enrich" it from the KG, never regenerate
> it, never reconcile it against Clio. Doing so silently replaces the user's own
> wording with KG content.

**Requires:** Clio MCP server configured (see Setup below) — **for Step A only**. Step B renders from local markdown and needs no Clio access at all, so the supplied-document path works with no MCP server configured.

---

## Entry Point — Smart Routing

**This section runs first, before any step, whenever the skill is invoked.**

### Step 0.0: Resolve the source document — BEFORE anything else

**Ask this question first, every time: did the user supply the content?**

The user supplied it if their message attaches a markdown file, gives a path to
one, pastes proposal content, or names one ("dựa vào file md tôi đính kèm",
"from the attached proposal", "use this md"). If so:

1. **Copy the supplied file VERBATIM** to `outputs/project_content_{project_id}.md`
   (resolve `project_id` via Step 0.1 first; ask the user for a short slug if it
   cannot be resolved — a supplied document needs no Clio project).

   **Copy means copy.** Do not rewrite headings, do not change `##` / `###`
   levels, do not split one chapter into several, do not invent a title for a
   table or a paragraph, do not merge or drop sections, do not summarize, do not
   translate, do not "convert it to the schema". `gen-slide.py` reads a proposal's
   own chapter titles directly — see `references/supplied-document.md`. Any
   rewriting you do is content the user did not write and did not ask for.

1b. **Write the `sections:` mapping — the ONE thing you may add.**

   You have just read the whole document, so you know which chapter is the
   background, which is the feature list, which is the cost. The parser does not:
   it falls back to a fixed alias table that only knows wordings someone met
   before, and a proposal phrased its own way reaches **none** of the 17 bespoke
   template slides. Prepend a front-matter block naming what you found:

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

   - Key = the chapter heading **exactly as the document writes it**.
   - Value = one section key, a `section.field` path, or a sentinel. An invalid
     value stops the run.
   - Valid keys: `cover`, `agenda`, `project_background`, `features`,
     `nfr_overview`, `screen_flow`, `business_process`, `benefits`,
     `approach_comparison`, `assumptions`, `infrastructure`, `software_stack`,
     `nfr_sections`, `nfr_detailed`, `deliverables`, `schedule`, `cost`, `team`.
     `team` (プロジェクト体制) owns chapter divider 17 and no content slide — its
     body is `org_chart` extra slides anchored to it. Two sections lifted out of
     ONE container chapter (`"5. 開発スケジュールおよび成果物": container` holding
     `### 全体スケジュール案` + `### 提出物`) share ONE divider named after the
     container, in markdown order — see `references/generate-content-schedule-team.md`.
   - Sentinels: `container` (this chapter's `###` subsections are the real
     sections) and `appendix` (this chapter claims no template slide).
   - Field paths: `project_background.current_issues`,
     `project_background.objectives`, `features.description`,
     `nfr_overview.description`, `schedule.description`.
   - Map only what you are sure of. An unmapped chapter falls through to the
     alias table and then to an appendix slide — the old behaviour, not a loss.

   **When one slide has two boxes, map each box.** Slide 4 heads its columns
   `Current Issues` and `Objectives`. A proposal usually writes those as separate
   chapters, and a section-level mapping cannot say which fills which — the first
   chapter to resolve claims the whole section and the second is locked out. Name
   the box instead, and stand the odd chapter down with `appendix`:

   ```markdown
   ---
   sections:
     "1. System Overview": container
     "1.1. Project Background": appendix
     "1.2. Current Challenges": project_background.current_issues
     "1.3. Primary Objective":  project_background.objectives
   ---
   ```

   **This block is metadata ABOUT the document, never a rewrite OF it.** The
   chapters, their order, their heading levels and their wording stay untouched.
   Adding front matter is the only permitted addition; step 1's rules still hold
   for everything below it.

1c. **`slides:` — the copy for a box, when the chapter is too long for it.**

   Front matter also switches on content SHAPING: list items reach the prose
   boxes instead of being discarded, and text too long for a box is reflowed to
   fit rather than poured in and cut. `gen-slide.py` reports each one:

   ```
   - Role 'current_issues': reshaped to its box — all 6 point(s) kept,
     elaborations trimmed to headlines (774 -> 265 chars)
   ```

   Read those lines. When one says points were **left off this slide**, the box
   is carrying less than the chapter says, and you may write the copy yourself:

   ```markdown
   ---
   slides:
     project_background.objectives:
       - All ring sensor data received without loss
       - BLE stable under realistic daily use, including background sync
   ---
   ```

   Same field paths as `sections:`. This wins over everything the parser derived.

   **It is copy DERIVED from the document, never new claims.** Every point must
   be something the chapter already says — shorter, not different. If a box needs
   a fact the document does not contain, the answer is to ask the user, not to
   write it here.

   `gen-slide.py` reports what happened — `Sections resolved: 9/9 chapters
   (8 mapping, 1 alias, 0 appendix)`. Read that line: a low ratio means chapters
   are landing on generic slides and the mapping needs more entries.

2. **Go straight to Step B.** Skip Step A entirely. Do NOT call `clio_query`, do
   NOT download from Clio, do NOT merge KG data in. Skip the Clio upload at the
   end of Step B too — the document is the user's, not Clio's.

3. Tell the user: `"Using your document as the only source — skipping gen md and
   Clio entirely, rendering the slide directly."`

If the user supplied nothing, fall through to Step 0.1 and use Clio as the
source, exactly as before.

> "The user gave me a file but the KG has fresher numbers" is not a reason to
> query the KG — it is a reason to say what looks stale and let them decide.

### Step 0: Resolve intent and project_id

1. **Determine project_id** — check in order:
   - Explicit `--project-id` argument from user
   - `.clio.yml` in CWD (`project_id: xxx`)
   - `.estimate.yml` in CWD (`project_id: xxx`)
   - If still missing: ask the user once, then proceed

2. **Determine which step to run** based on the user's input:
   - User passed `--gen md` explicitly → go to **Step A only**
   - User passed `--gen slide` explicitly → go to **Step B only**
   - Otherwise (no flag, or natural language like "gen slide for project X", "tạo slide", "generate proposal") → **Auto mode**: continue to Step 0.3 below

3. **Auto mode — check for existing local markdown:**
   ```bash
   ls outputs/project_content_{project_id}.md 2>/dev/null
   ```
   - **File exists** → skip Step A, go directly to **Step B**. Inform the user: `"Found existing markdown outputs/project_content_{project_id}.md — skipping gen md, rendering slide directly."`
   - **File does NOT exist** → run **Step A** first (silently, no need to ask the user), then **Step B** automatically when Step A completes. Inform the user: `"No local markdown found — running gen md first, then gen slide automatically."`

> **Do NOT ask the user which step to run.** The check above is deterministic. Only ask if `project_id` cannot be resolved.

> **`--gen slide` does not override Step 0.0.** The flag picks the step; Step 0.0
> picks the source. A user who passes `--gen slide` AND attaches a document still
> gets the document copied into place first — the flag is not permission to render
> a stale `outputs/project_content_{id}.md` from an earlier run.

---

## Data Provider

**Clio Knowledge Graph is the data provider for Step A only, and Step A runs
only when the user supplied no document of their own** (Step 0.0). Everything
below describes that path; on the supplied-document path none of it applies and
no MCP server is needed.

- Query tool: `clio_query` MCP tool
- Config: `.clio.yml` (primary) / `.estimate.yml` (fallback)

### Setup

The `clio` MCP server block goes in `.mcp.json` or `~/.claude/settings.json` —
copy it from `data/mcp-config-snippet.json` (http, `https://clio.sun-asterisk.vn/mcp`,
`x-api-key: ${CLIO_API_KEY}`). Then create `.clio.yml` in the project root with
`project_id: your-project-id`.

### After ANY change to `templates/SVN Proposal Menu.pptx`

`lib/templates/svn.py` addresses the template by exact string and by shape index. Editing the `.pptx` silently disables a mapping rather than erroring — so run the contract check and fix what it names:

```bash
$VENV_PYTHON $SKILL_DIR/scripts/verify-template-contract.py
```

Exit 0 means every mapping still resolves. A failure is reported and fixed, never silenced by deleting the entry — dropping a `TEMPLATE_NOTE_TEXTS` line re-ships a Vietnamese authoring note to the client.

---

## Step A — `--gen md`

> **Skip this whole step when the user supplied the source document** (Step 0.0).
> Everything here — the KG queries, the reference files, the content templates
> they prescribe — exists to *author* a profile when there isn't one. Applying
> any of it to a document the user already wrote rewrites their content. In
> particular the section templates in `references/` fix a column shape for each
> table (the feature table's `No / カテゴリ / PID / 画面・機能 / 機能要件 / 詳細`,
> for one); those shapes are for KG-authored content only, and a supplied
> document's own tables are copied as they stand, column for column.

The agent checks Clio for an existing profile markdown (downloading all associated assets), then either merges new KG data into it or generates a fresh one from scratch. The result is saved locally for user review — all uploads happen in Step B after the slide renders.

### Workflow

1. **Read project_id** from `.clio.yml` (fallback `.estimate.yml`; ask user if missing)

2. **Check Clio for existing SLIDE_CONTENT file** — call the `clio_get_assets_download_url` MCP tool:
   ```json
   { "project_id": "{project_id}" }
   ```
   The response contains an `items` array. If empty → Case 1.1. If non-empty → Case 1.2.

3. **If file exists on Clio (Case 1.2):**
   - Download **ALL items** returned by the list response — iterate over every item regardless of file type:
     - For `.md` files: save to the canonical fixed name `outputs/project_content_{id}.md`
     - For all other files (`.png`, etc.): save using their remote filename `outputs/{file_name}`

   > **⚠️ CRITICAL — HOW TO DOWNLOAD:** Always use the **Bash tool** to call `clio-api.py download`. **NEVER use WebFetch** for presigned S3 URLs — WebFetch goes through a proxy that blocks the storage domain, and presigned URLs are too long for WebFetch anyway. The only correct method is via the Python script below.

     ```bash
     VENV_PYTHON=$([ -f ".claude/skills/.venv/bin/python3" ] && echo ".claude/skills/.venv/bin/python3" || echo "python3")
     SKILL_DIR=".claude/skills/bidding-proposal"

     # For the markdown file (run via Bash tool):
     $VENV_PYTHON $SKILL_DIR/scripts/clio-api.py download \
       --url "{md_download_url}" \
       --output outputs/project_content_{id}.md
     # For every other file in the list (PNG, etc.) — do NOT skip any:
     $VENV_PYTHON $SKILL_DIR/scripts/clio-api.py download \
       --url "{item_download_url}" \
       --output outputs/{item_file_name}
     ```
   - Query KG for the latest data for each section — read each reference file first, then execute the **exact Japanese query strings** defined in that file. Do NOT write your own queries, do NOT translate to English. The KG is built from Japanese documents and only returns results for Japanese queries.
   - Compare KG data against downloaded markdown section by section:
     - **New info not in markdown** → append/update the relevant section
     - **Conflict (KG value differs from existing value)** → mark inline:
       ```
       <!-- CONFLICT: KG says "X", current value is "Y" — needs review -->
       ```
   - **PNG regeneration:** If KG data for `screen_flow` or `schedule` sections changed (new diagram content detected), regenerate the affected PNG(s) via Mermaid CLI and overwrite the local file. They will be uploaded in Step B.
   - The merged result is already at `outputs/project_content_{id}.md` (the file downloaded above, edited in place)

4. **If no file on Clio (Case 1.1):**
   - Query Clio KG for each domain section — **read each reference file first**, then execute the **exact Japanese query strings** defined step-by-step in that file. Do NOT write your own queries. Do NOT translate to English. The KG is built from Japanese documents; English queries return empty results.
   - Generate PNG images (Mermaid CLI for screen flow + schedule)
   - Assemble JSON matching `ProjectProfile.to_dict()` shape
   - Invoke `gen-md.py` with `--project-id {id}` — outputs `outputs/project_content_{id}.md` (fixed name, no timestamp)

5. **Report to user:**
   - If conflicts were found: `"Found N conflict(s) marked in the markdown. Please review and edit outputs/project_content_{id}.md to resolve all <!-- CONFLICT: ... --> markers, then run --gen slide."`
   - If no conflicts: `"Markdown generated/updated locally. Run --gen slide when ready."`

### Profile JSON shape

The JSON the agent assembles must match the dataclass tree in `scripts/lib/profile_schema.py`. Top-level keys: `cover`, `agenda`, `project_background`, `features`, `nfr_overview`, `screen_flow`, `business_process`, `benefits`, `approach_comparison`, `assumptions`, `infrastructure`, `software_stack`, `nfr_sections`, `nfr_detailed`, `schedule`. Omit any section the KG has no data for.

`cover` (`{company, date}`) and `agenda` (`{chapters[], cost_breakdown[]}`) fill slides 1 and 2. Both are optional — omitted, the template keeps its own wording. How to source and word them: `references/cover-and-agenda.md`.

### Reference Files (what to query per section)

| Section(s) | Reference |
|------------|-----------|
| project_background, features, nfr_overview | `references/generate-content-overview.md` |
| screen_flow, business_process | `references/generate-content-flow.md` |
| benefits | `references/generate-content-benefits.md` |
| approach_comparison, assumptions | `references/generate-content-approach.md` |
| infrastructure, software_stack, nfr_sections, nfr_detailed, schedule | `references/generate-content-technical.md` |

### Invocation (Case 1.1 — fresh generation)

```bash
VENV_PYTHON=$([ -f ".claude/skills/.venv/bin/python3" ] && echo ".claude/skills/.venv/bin/python3" || echo "python3")
SKILL_DIR=".claude/skills/bidding-proposal"

# Agent writes JSON to a temp file, then:
$VENV_PYTHON $SKILL_DIR/scripts/gen-md.py \
  --project-id {project_id} \
  --input /tmp/profile_{project_id}.json \
  --output-dir outputs/
```

---

## Step B — `--gen slide`

Reads the profile markdown and renders the SVN PPTX. **No Clio KG access needed** —
this is the whole of the run when the user supplied the source document (Step 0.0).

### Workflow

1. **Locate input** — use `outputs/project_content_{id}.md` (fixed filename, one file per project). On the supplied-document path this is the verbatim copy Step 0.0 placed there; do not re-derive or regenerate it.
2. **Check for unresolved conflicts** — scan the file for any `<!-- CONFLICT:` markers:
   - If found: **stop immediately** and tell the user:
     `"The markdown still has N unresolved conflict(s). Please edit outputs/project_content_{id}.md, resolve all <!-- CONFLICT: ... --> markers, then re-run --gen slide."`
   - If none: proceed
   > Conflict markers only ever come from Step A's KG merge. A supplied document has none, so this check passes untouched.
3. **Invoke `gen-slide.py`** — parses profile, runs role-based rendering against the SVN template
   > **Read the last line it prints.** `[gen-slide] WARNING: slide 1 still shows the TEMPLATE PLACEHOLDER` means the cover kept `SVN Proposal Menu` / `2025.04.04` because the document's addressee or date notation wasn't understood. Do NOT edit the user's document — re-run with `--cover-company "..."` / `--cover-date "..."` (see `references/cover-and-agenda.md`) before going any further.
4. Output → `outputs/proposal_{id}_{ts}.pptx`
   > The default name is built from the `# Project Profile: {id}` / `Generated: {ts}` header lines. A supplied proposal has neither, which would name the file `proposal__.pptx` — so on that path **always pass `--output proposal_{project_id}` explicitly**.
5. **Visual QA (best-effort, skips silently if `officecli` isn't installed):**
   - From `gen-slide.py`'s stdout, collect every `- Inserted extra slide "..." [...] at index N` line (printed for both auto-routed unrecognized sections and manually-authored `--extra-slides` entries). Slide number = `N + 1` (the print is 0-indexed). This is `--auto-slides` below — pass `""` if no such lines were printed.
   - Run `collect-qa-slides.py` to widen the net beyond auto-routed slides: it also asks `officecli view <pptx> issues` for real text-overflow/off-slide/overlapping-shape hotspots and folds in the noisiest ones (capped at `--max-extra`, default 5, so a deck's already-known-and-handled overflow — see `_queue_overflow_extra` in `renderer.py` — doesn't balloon the QA batch). This is what catches bugs in the 17 bespoke template slides that auto-routing alone never looks at.
     ```bash
     VENV_PYTHON=$([ -f ".claude/skills/.venv/bin/python3" ] && echo ".claude/skills/.venv/bin/python3" || echo "python3")
     SKILL_DIR=".claude/skills/bidding-proposal"

     $VENV_PYTHON $SKILL_DIR/scripts/collect-qa-slides.py \
       --input outputs/proposal_{id}_{ts}.pptx \
       --auto-slides "{comma-separated 1-indexed slide numbers from step above, or empty string}"
     ```
     Prints `{"available": false, "slides": "..."}` if `officecli` can't be reached (falls back to just the auto-routed slides, same as before) or `{"available": true, "slides": "...", "issue_flagged_dropped": [...], ...}`. If `issue_flagged_dropped` is non-empty, mention in passing that N additional lower-priority slides were skipped by the cap — don't block on it.
     - If `slides` is empty, skip QA entirely — nothing to check.
   - Otherwise screenshot exactly that slide list:
     ```bash
     $VENV_PYTHON $SKILL_DIR/scripts/qa-slides.py \
       --input outputs/proposal_{id}_{ts}.pptx \
       --slides "{the "slides" value from collect-qa-slides.py}" \
       --output-dir outputs/qa_{id}/
     ```
   - **No officecli / LibreOffice on the machine** (typical on a locked-down Mac): export the PPTX to PDF from PowerPoint (File → Export) and rasterize with PyMuPDF (`fitz`: `page.get_pixmap(matrix=fitz.Matrix(1.3, 1.3)).save(...)`) into `outputs/qa_{id}/slide-NN.png`, then Read the PNGs exactly as below. PowerPoint's AppleScript `save … as save as PDF` is blocked by its sandbox for files outside its container — do not spend time automating it.
   - Both scripts auto-download `officecli` on first use if not already on PATH (cached under `~/.cache/bidding-proposal/bin`, verified against the release's SHA256SUMS — no PATH/system changes, safe to delete). If `qa-slides.py` prints `{"available": false}` — unsupported platform or no network reachable to GitHub — skip QA and fall back to the existing manual-review message below.
   - If it prints `{"available": true, "screenshots": [...]}` — for each entry with `"ok": true`, use the **Read tool** on its `path` (PNG) and check for text overflow, overlapping shapes, empty/orphaned placeholder boxes, or an obviously broken layout. Entries with `"ok": false` mean that slide couldn't be rendered (log the error, don't block on it). Some slides pulled in by the issues scan may turn out fine on inspection (e.g. an off-slide decorative shape from the base template, or text truncation already handled by the appendix mechanism) — that's expected noise, not a failure; only act on what's actually visible and wrong.
     - **Issues found** → tell the user which slide number(s) and what looks wrong, then ask whether to proceed with upload as-is or fix `outputs/project_content_{id}.md` first (loop back to editing + re-running `--gen slide` if they choose to fix).
     - **No issues** → proceed straight to upload, no need for the manual-review prompt.

> **STOP HERE on the supplied-document path.** Steps 6 and 7 upload to Clio, and
> the content is the user's document, not Clio's — pushing it there publishes a
> document they only asked you to render. Hand back the PPTX and finish. Upload
> only if the user asks for it in so many words.

6. **Upload to Clio — Clio-sourced runs only.** Follow `references/clio-upload.md`:
   the approved markdown and every PNG in `outputs/` as assets, then the PPTX as
   an artifact. On the supplied-document path, stop at step 5 instead.
### Invocation

```bash
$VENV_PYTHON $SKILL_DIR/scripts/gen-slide.py \
  --input outputs/project_content_{project_id}.md \
  --output-dir outputs/
```

`--template` defaults to `SVN Proposal Menu.pptx` (auto-resolved from `templates/`).

`--cover-company` / `--cover-date` force slide 1's client name and date, overriding
the document. Add them only when gen-slide's closing WARNING says the cover went
unfilled — the parser reads the addressee (`御中`, `Kính gửi`, `Prepared for:`) and
the date (`YYYY.MM.DD`, `YYYY/MM/DD`, `YYYY-MM-DD`, `YYYY年M月D日`) on its own:

```bash
  --cover-company "Evering" --cover-date 2026-04-19
```

> **Environment note:** `VENV_PYTHON` auto-detects the interpreter — uses the venv on local/Takumi installs, falls back to system `python3` on sandboxes where the venv is absent. Both `clio-api.py` and `gen-slide.py` call `ensure_deps()` at startup to self-bootstrap `python-pptx`/`lxml`/`Pillow`/`requests` into a writable temp dir when the packages are not yet installed. No manual `pip install` needed.

---

## Hand-written / free-form markdown — how a supplied document is read

**This is why Step 0.0 says "copy verbatim".** `gen-slide.py` reads a proposal's
own chapter titles directly and fills the bespoke template slides from them; a
chapter it cannot place becomes an `Appendix` slide (reported on stdout as
`[profile-parser] WARNING: unrecognized section "..."`), never dropped. Each
slide is headed by the document's own title, and a non-Japanese document also
Englishes the template's fixed labels — no flag, the language is read off the
document. Heading-matching, container unwrapping, per-shape layout and the
WARNING list: **`references/supplied-document.md`**. Read it before reshaping
any document.

---

## Step B (optional) — `--extra-slides` AI-generated extra slides

Free-form sections that fit none of the 17 template slides render as extra slides
(`bullets`, `numbered_points`, `card_grid`, `comparison_2`, `process_flow`, `hero`,
`table`, `gantt`, `org_chart`) after the section they follow. Hand-written `##`
headings are auto-routed; hand-craft JSON only when the heuristic's layout falls
short. Contract + workflow: **`references/extra-slides.md`**; schedule/team
layouts: `references/generate-content-schedule-team.md`.

---

## Common Rules

- Read `project_id` from `.clio.yml` first, fallback to `.estimate.yml`; ask user if missing
- All KG queries run **SEQUENTIALLY** (not parallel)
- Use `clio_query` MCP tool for all KG queries
- **KG queries MUST use the exact Japanese text defined in each reference file** — do NOT write your own queries, do NOT translate to English. The KG is built from Japanese documents; English queries always return empty results.
- If a query returns empty/unclear, run one broader follow-up; if still unknown, omit that field
- All outputs saved to `outputs/` in CWD (or `SLIDE_GENERATOR__OUTPUTS_PATH` env var)
- **No fabrication** — only include data from KG
- **PNG images only** — generate PNG files via Mermaid CLI; reference them as file paths in the profile (no base64)

---

## Output Files

`outputs/project_content_{id}.md` (profile), `outputs/proposal_{id}_{ts}.pptx`
(deck), plus `screen_flow_*.png` / `schedule_*.png` on the Clio path. What each
one is and what gets uploaded to Clio — nothing does on the supplied-document
path: **`references/generate-pptx.md`**.

---

## Slide Coverage & Troubleshooting

The template is a slide POOL, not a skeleton: only sections present in the
profile produce slides, and a divider survives only when its chapter filled one.
Coverage table + appendix donor rules: **`references/slide-coverage.md`**.
Symptoms and fixes: **`references/troubleshooting.md`**.

---

## Changelog

- **3.4.0** — designed list layouts (a plain list renders as ONE block, a labelled one keeps its label column); a schedule table is drawn as a timeline chart in the slide-43 frame instead of a grid; fenced ASCII diagrams become real images; golden whole-deck fixtures plus `verify-template-contract.py` and a CI python job so both actually run; fixes: an alternative-design slide no role filled is no longer kept (an empty 本提案のポイント page shipped whenever 提案の要諦 was written as a matrix), the Gantt's own table is no longer re-printed beside the Gantt it became, a container chapter keeps its own divider name with one live subsection and no AGENDA, a resource matrix that skips a month stays aligned to its axis, a short first table row no longer deletes a column from the whole table, and `2026/06 - 2026/08` counts as a range.
- **3.3.0** — native Gantt on slide 43 from a `工程|担当|開始|終了` table (no PNG); `gantt` / `org_chart` extra layouts; `team` section → divider 17 with `org_chart` extras; container chapters share one divider named after the container (schedule + deliverables merge); template caption `機能一覧表サンプル` stripped; on a Japanese document gen-md's schema headings (`## Features`, `## Cost`) no longer retitle slides to English — the template's Japanese titles stay, only an author-worded heading retitles; QA fallback without officecli documented.
- **3.2.0** — supplied-document path, `sections:` front matter, auto-routed extra slides, `table` layout.

## References
- `references/generate-content-schedule-team.md` — §5 スケジュール・成果物 (Gantt table shape, 提出物) and §6 体制 (`org_chart` entries) content rules

| Topic | File |
|-------|------|
| Profile schema (dataclass tree) | `scripts/lib/profile_schema.py` |
| Slide → profile section mapping | `scripts/lib/templates/svn.py` |
| S3 PUT + download helper (2 subcommands: put, download) | `scripts/clio-api.py` |
| QA slide selection (auto-routed + OfficeCLI issue hotspots, capped) | `scripts/collect-qa-slides.py` |
| Overview sections (background, features, NFR overview) | `references/generate-content-overview.md` |
| Flow sections (screen flow, business process) | `references/generate-content-flow.md` |
| Benefits | `references/generate-content-benefits.md` |
| Approach + assumptions | `references/generate-content-approach.md` |
| Technical (infra, software, NFR detail, schedule) | `references/generate-content-technical.md` |
| Step B execution detail | `references/generate-pptx.md` |
| MCP config snippet | `data/mcp-config-snippet.json` |
| Slide → section coverage table, appendix donor rules | `references/slide-coverage.md` |
| Troubleshooting table | `references/troubleshooting.md` |
