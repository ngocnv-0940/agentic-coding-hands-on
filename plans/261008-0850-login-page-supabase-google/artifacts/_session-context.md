# Session Context — rebuild-spec

<!-- Generated: 2026-10-08T06:21:33Z  | Plan: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google -->
<!-- All subagents in this session MUST read this file before any other artifact read. -->

## Stack
- detectedStack: JS/TS
- isMultiStack: True
- stackNote: JS/TS

## Counts
- feature_count: 2

## Source Encoding
- profile: web-js-ts
- primary: utf-8
- rule: Source files are utf-8-encoded. Structural extractors (Phase B `decode_source`) decode with this encoding; the prose Read tool is best-effort. On a non-UTF-8 repo, suspected mojibake in prose → tag `[ENCODING_ADVISORY]`. Encoding is verified deterministically at the extractor layer, not here.

## Language Directive (generation mode)
- mode: generate
- prose_lang: vi
- rule: Write all prose in vi. Keep ALL headings, code tokens (F###/US###/SCR###/BL###/PERM###/DEC-###/DISC-###/MODEL###), field labels, table-column headers, fenced code blocks, frontmatter, file paths, and status enums in English (canonical skeleton).

## Always-read pointers (use Read tool, not Grep)
- plans/261008-0850-login-page-supabase-google/artifacts/system-overview.md  — global narrative (small)
- .claude/skills/rebuild-spec/references/code-formats.md  — code schemas AND § Feature Clustering Rule (authority)

## Grep-only pointers (DO NOT load in full)
- plans/261008-0850-login-page-supabase-google/artifacts/scout-report.md  — file inventory + BL inventory; section-scoped reads only
- plans/261008-0850-login-page-supabase-google/artifacts/feature-list.md  — per-F### entries; grep by code
- plans/261008-0850-login-page-supabase-google/artifacts/user-stories.md  — per-US### sections
- plans/261008-0850-login-page-supabase-google/artifacts/screen-list.md, screen-flow.md, behavior-logic.md, permissions.md, route-list.md, data-model.md

## Templates (read once per task, not per check)
- .claude/skills/rebuild-spec/templates/feature-spec-template.md
- .claude/skills/rebuild-spec/templates/review-report-template.md
- .claude/skills/rebuild-spec/templates/scout-report-template.md

## Contracts
- .claude/skills/rebuild-spec/references/feature-spec-researcher-contract.md
- .claude/skills/rebuild-spec/references/verification-checklist-universal.md
- .claude/skills/rebuild-spec/references/verification-checklist-core-artifacts.md (W7a)
- .claude/skills/rebuild-spec/references/verification-checklist-feature-spec.md (W7b)
- .claude/skills/rebuild-spec/references/verification-checklist-screen-spec.md (SS.2)
- .claude/skills/rebuild-spec/references/verification-checklist-quality-gates.md (W4.5/W5.6)
- .claude/skills/rebuild-spec/references/canonical-fcode-schema.md

## Reminders (avoid these wastes)
1. Do NOT re-derive detectedStack from scout-report; it's above.
2. Do NOT load scout-report.md in full — Grep `## Background Logic Source Inventory` section if you need BL inventory.
3. Do NOT re-summarize system-overview.md across multiple steps — read once.
4. Do NOT write multi-line PASS evidence — see review-report-template.md § Passed Checks rule.
5. On successful primary output write (spec.md / review-report.md), call `TaskUpdate(status=completed)` on your own task id (see phase-06 self-close rule).
