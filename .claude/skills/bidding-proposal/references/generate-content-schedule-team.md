# Schedule & team chapters — 開発スケジュールおよび成果物 / プロジェクト体制

How a supplied proposal's §5 (schedule + deliverables) and §6 (project structure)
reach the deck, and the shapes their content must take. Modeled on the Sun*
reference deck (`システム構築のご提案_Sample.pptx`, slides 21–26): one chapter
divider, a Gantt with bars per owner, a 提出物 table, then a 体制図 per phase with
a 各ロールの役割 legend.

## 1. Chapter shape in the markdown

```markdown
---
sections:
  "5. 開発スケジュールおよび成果物": container
  "6. プロジェクト体制": team
---

## 5. 開発スケジュールおよび成果物

### 全体スケジュール案            ← resolves to `schedule` (slide 43)
<one lead sentence, ≤ 90 chars>

| 工程 | 担当 | 開始 | 終了 |
|---|---|---|---|
| P1 要件定義 | Sun* | 2026/12 | 2027/03 |
| 要件レビュー・承認 | 貴社 | 2027/03 | 2027/03 |
| P2 開発・テスト | 次フェーズ | 2027/09 | 2027/11 |
| ★P1稼働 | マイルストーン | 2027/09 | |

### 提出物                        ← resolves to `deliverables` (slide 39)
各工程は成果物の貴社承認をもって完了とします。

| 工程 | 成果物 | 内容 | 備考 |
|---|---|---|---|

## 6. プロジェクト体制             ← `team`: divider 17 + extra slides
<one lead sentence>
```

- The container makes schedule and deliverables **one chapter with one divider**
  (template slide 41, renamed after the container heading; divider 37 is dropped).
  Write `### 全体スケジュール案` BEFORE `### 提出物` — slides follow markdown order.
- A `工程 | 担当 | 開始 | 終了` table is the Gantt (`schedule.gantt_rows`). Any other
  table in the chapter is a milestone list and gets a `table` slide of its own.
- `担当` decides the bar colour and must match slide 43's legend: `Sun*` red,
  `貴社` blue, `次フェーズ`/`P2` dashed red, anything else grey. **Always give the
  client at least one bar** (レビュー・承認, 受入テスト, 並行運用の突合) — the
  legend says 貴社, so the chart must show 貴社.
- Milestones: `担当` = `マイルストーン`, or 工程 starting with ▲ ★ ◆. They render as
  markers in a bottom lane; ≥ 2 (要件定義完了 + リリース) reads as a real plan.
- Caps: 10 bars, 14 months (`gantt_layout.py`). Over → the run stops with a
  ValueError naming the cap; merge rows or shorten the axis.
- 提出物 备考 carries format / language / approver (`Sun*雛形・日本語・業務部長承認`),
  the way the reference deck writes it. Say what is NOT included (マニュアル・教育
  → `別途提案`) as a row, not in prose.

## 2. `team` — divider + `org_chart` extras

`team` owns chapter divider 17 (the template's unused Sun*のスコープ divider) and
no content slide. Its body comes from `--extra-slides` entries anchored to it,
inserted right after the divider in the order given:

```json
{"layout": "org_chart", "title": "プロジェクト体制（要件定義）", "anchor_section": "team",
 "lead": "要件定義フェーズにおいて想定している体制図および各メンバーの役割は、以下の通りです。",
 "lanes": [
   {"title": "貴社", "accent": "gold",
    "nodes": [{"label": "専務取締役", "sub": "最終意思決定"}, {"label": "業務部長", "sub": "窓口・承認"}]},
   {"title": "Sun*", "accent": "red",
    "nodes": [{"label": "PSM", "sub": "全体管理・定例"}, {"label": "Lead BrSE", "sub": "要件定義"}]}],
 "roles": [{"name": "PSM", "desc": "全体管理・定例・意思決定支援"}],
 "roles_title": "各ロールの役割"}
```

- One slide per phase (要件定義 / 開発・テスト・移行) — the reference deck does the
  same; the title's qualifier in （ ） is kept when the AGENDA chapter is renamed.
- 1–3 lanes (貴社 / Sun* — split Sun* by location only when it is true), ≤ 6 nodes
  per lane (> 4 wraps into two columns), ≤ 8 roles. Role names must match the
  positions in the cost table — no personal names.
- A `###` table under `## プロジェクト体制` (役割分担, RACI) also reaches the deck,
  as a `table` slide after the divider.
- The divider reads the chapter's own name (`プロジェクト体制`) and the AGENDA gloss
  (`Project Structure`); the extras take the gloss as their breadcrumb.

## 3. KG queries (Step A only)

When authoring from Clio rather than a supplied document, query per chapter:

- schedule: `スケジュール マイルストーン 稼働 リリース 要件定義 開発 テスト 移行 並行運用 UAT`
- deliverables: `成果物 納品物 設計書 仕様書 テスト報告 移行 運用手順`
- team: `体制 役割 PM BrSE Communicator 設計 開発 QA インフラ 窓口 意思決定`

Then write the markdown in the shape of §1 — never a PNG for the Gantt.

## 4. Checks before handing over

- `gen-slide` stdout: `Sections resolved … 0 appendix`; a line `Schedule: drew a
  native Gantt (N bars, M milestone(s))`; `Divider 41 named from the source
  chapter`; `Divider 17 named from the source chapter`.
- No slide text `想定作成物`, `実施スケジュール` (old dividers) or `Sun*のスコープ`.
- Screenshot the schedule slide and both 体制 slides (see SKILL.md → Visual QA;
  without officecli, export PDF from PowerPoint and rasterize with PyMuPDF).
