---
name: project-plan-md-format-conventions
description: plan.md phases table must be the canonical 3-column form; owner/track/effort go on a separate line (MoMorph plans in this repo)
metadata:
  type: project
---

plan.md phases table must be exactly `| Phase | Name | Status |`; a hook warns on extra columns and `tkm plan status` parses only that form. Put owner · track · depends · effort on one line under the table (precedent: plans/261008-1705-homepage-saa/plan.md).

**Why:** a 6-column table triggered the Plan Status Warning hook (2026-10-13, awards-information plan).

**How to apply:** every MoMorph plan here: 3-col table, then the owner line; Track A phase ≤30 lines with `test_policy`; each phase ends with the MoMorph refs block. New dictionary keys go in `lib/i18n/dictionary-<feature>-{vi,en}.ts`, spread into the main files. See [[project-next-docs-access-and-cache-components]].
