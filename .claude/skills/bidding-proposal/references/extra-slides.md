<!-- Moved out of SKILL.md (500-line cap). Authoritative reference for the --extra-slides path. -->

# Step B (optional) — `--extra-slides` AI-generated extra slides

After Step A, the user may edit the content markdown and add **free-form extra sections** that don't fit the 17 fixed slide templates. Each is rendered as a polished slide using a **generate-slide-style layout** (ported from `tkm:generate-slide`), drawn onto a blank canvas cloned from the template's blank end card and inserted right after the section it follows.

Use this when an AI agent should pick the layout deliberately (e.g. to match a specific visual intent). For markdown that's simply hand-written without following the schema at all, the automatic routing above already handles it with zero extra authoring — reach for `## extra:` + hand-crafted JSON only when the automatic heuristic's layout choice isn't good enough.

### Convention in content MD

```markdown
## Features
...

## extra: Migration Strategy
Free-form content the user wants to add. Bullets, paragraphs, anything.
- Phase 1: data export
- Phase 2: dual-write
- Phase 3: cutover

## Non-Functional Requirements (Overview)
...
```

- Heading prefix `## extra:` (case-insensitive) marks an extra section.
- The **anchor section** is the nearest preceding `## <known section>` heading — the new slide is inserted right after the slide(s) that section fills (e.g. `## extra:` placed after `## Features` → inserted after slide 5).

### Agent workflow when user requests extra slides

1. Read the content markdown; locate every `## extra: <title>` block and its preceding known section.
2. For each block, **pick a layout** that fits the content shape (the layouts are defined in `scripts/lib/extra_slide_layouts.py`; the shape-to-layout heuristic is tabulated in `references/supplied-document.md`) and produce structured content for that layout via AI. Vary layouts across slides.
3. Write a JSON file `/tmp/extra_slides_{project_id}.json` — a list of slide entries:
   ```json
   [
     {
       "layout": "numbered_points",
       "title": "Migration Strategy",
       "anchor_section": "features",
       "points": [
         {"header": "Data export", "body": "Export legacy data to staging."},
         {"header": "Dual-write", "body": "Write to both systems."},
         {"header": "Cutover", "body": "Switch traffic over."}
       ]
     }
   ]
   ```
   - `anchor_section` ∈ keys of `SECTION_TO_SLIDES` in `scripts/lib/templates/svn.py`, or `team` (inserted right after its divider). Or pin with `"anchor_slide": <int>`.
   - Layouts: `bullets`, `numbered_points`, `card_grid`, `comparison_2`, `process_flow`, `hero`, `table`, **`gantt`** (bars per month, owner-coloured like slide 43's legend) and **`org_chart`** (1–3 lanes of role boxes + 各ロールの役割). Entry shapes for the last two: `scripts/lib/gantt_layout.py` / `org_chart_layout.py`; content rules: `references/generate-content-schedule-team.md`.
4. Invoke gen-slide with the extra slides:
   ```bash
   $VENV_PYTHON $SKILL_DIR/scripts/gen-slide.py \
     --input outputs/project_content_{id}.md \
     --extra-slides /tmp/extra_slides_{id}.json \
     --output-dir outputs/
   ```

### Supported layouts (`layout` field + per-layout content keys)

Implemented in `scripts/lib/extra_slide_layouts.py`. Every entry takes an optional `title`.

| `layout` | Content key | Shape it fits |
|----------|-------------|---------------|
| `bullets` *(default)* | `bullets: [str]` | simple list, fallback |
| `numbered_points` | `points: [{header, body}]` (3–5) | sequential/enumerated points |
| `card_grid` | `items: [{title, body, icon?}]` (≤4) | 4 parallel concepts |
| `comparison_2` | `columns: [{title, items:[str]}, {title, items:[str]}]` | two things compared |
| `process_flow` | `steps: [str]` (3–5) | sequential steps |
| `hero` | `message: str` | one big takeaway |

### Notes
- Layouts use the Sun* palette (Sun Red `FF2200`, gold, greys) + Noto Sans JP, auto-scaled from the generate-slide 13.333″ canvas to the SVN 10″ canvas.
- Extra slides are created from a **content slide's layout**, so they inherit the deck's background + master footer / page number / logo. The layout content is drawn directly on top (no white overlay), so the template shows through.
- Overflow handling from main rendering (e.g. table splits in slides 23-25) is accounted for — anchor positions adjust automatically.
- Multiple extras with the same anchor are inserted in the order they appear in the JSON.
- To add a new layout: add a renderer fn in `extra_slide_layouts.py` and register it in `_LAYOUTS`.

---
