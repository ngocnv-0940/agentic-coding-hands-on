# Step B — Render PPTX from profile markdown

**Goal:** Convert `project_content_{id}_{ts}.md` (Step A output) into the SVN proposal PPTX via the local `gen-slide.py` script.

This step has no Clio dependency — it is pure markdown → PPTX rendering driven by role-based template configs in `scripts/lib/templates/svn.py`.

---

## Step B.1: Verify Step A outputs

```bash
ls -lh outputs/project_content_{project_id}_*.md
ls -lh outputs/screen_flow_{project_id}_*.png 2>/dev/null
ls -lh outputs/schedule_{project_id}_*.png 2>/dev/null
```

Required:
- `outputs/project_content_{id}_{ts}.md` — canonical profile (Step A)

Optional (referenced from inside the profile as `Image: <path>`):
- `outputs/screen_flow_{id}_{ts}.png` — Slide 8
- `outputs/schedule_{id}_{ts}.png` — Slide 43

---

## Step B.2: Run gen-slide.py

```bash
VENV_PYTHON=".claude/skills/.venv/bin/python3"
SKILL_DIR=".claude/skills/bidding-proposal"

$VENV_PYTHON $SKILL_DIR/scripts/gen-slide.py \
  --input outputs/project_content_{project_id}_{timestamp}.md \
  --output-dir outputs/
```

Optional flags:
- `--output NAME` — output PPTX name without extension (default: `proposal_{id}_{ts}`)
- `--template "SVN Proposal Menu.pptx"` — name auto-resolves under `bidding-proposal/templates/`

Output: `outputs/proposal_{project_id}_{timestamp}.pptx`.

---

## Step B.3: Completion message

```
=== Slide Proposal Generation Complete ===

Inputs:
  Profile:     outputs/project_content_{project_id}_{timestamp}.md
  Screen flow: outputs/screen_flow_{project_id}_{timestamp}.png (if present)
  Schedule:    outputs/schedule_{project_id}_{timestamp}.png  (if present)

Output:
  outputs/proposal_{project_id}_{timestamp}.pptx

Filled slides: 4, 5, 6, 8, 10, 11, 12, 13, 21, 23-25, 33, 34, 35, 36, 43
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Profile file not found | Re-run Step A (`--gen md`) |
| Template not found | Verify `SVN Proposal Menu.pptx` exists under `.claude/skills/bidding-proposal/templates/` |
| `python-pptx` missing | `.claude/skills/.venv/bin/pip install python-pptx lxml` |
| Section missing from output deck | Expected — that profile section had no data, so no slide is produced (content-driven picking). Add the section's data in Step A to include it. |
| Image not embedded | Profile must reference image as `Image: /absolute/or/relative/path.png` under `## Screen Flow` or `## Schedule → ### Chart` |
| Table overflow lost rows | `MAX_TABLE_ROWS_PER_SLIDE = 8` in `renderer.py`; overflow creates continuation slides automatically |

---

## Output files a run produces

| File | Step | Description |
|------|------|-------------|
| `outputs/project_content_{id}.md` | A, B | Domain-organized profile; uploaded to Clio as `SLIDE_CONTENT` in Step B via `clio_get_assets_upload_url` |
| `outputs/screen_flow_{id}_{ts}.png` | A, B | Screen transition diagram (Mermaid); uploaded to Clio in Step B; regenerated if flow data changed |
| `outputs/schedule_{id}_{ts}.png` | A, B | Gantt chart (Mermaid); uploaded to Clio in Step B; regenerated if schedule data changed |
| `outputs/proposal_{id}_{ts}.pptx` | B | Final PPTX; uploaded to Clio as `SLIDE_PROPOSAL` via `clio_get_artifacts_upload_url` |

> Every "uploaded to Clio" above applies to **Clio-sourced runs only**. On the
> supplied-document path (Step 0.0) nothing leaves the machine: the profile
> markdown is the user's own file and the PPTX is handed back directly. The PNGs
> are not produced at all — they come from Step A's Mermaid generation.
