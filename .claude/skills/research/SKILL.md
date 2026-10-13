---
name: tkm:research
description: "Weigh the options before committing to one — multi-source technical research that ranks candidates and puts numbers on the trade-offs. Reach for it when sizing up a technology, hunting established practice, or stress-testing an architecture for scale, security, or longevity."
license: MIT
argument-hint: "[topic] [--level low|medium|high|max]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
module: implementation
triggers: ["research", "evaluate", "compare libraries", "best practice for", "what technology", "investigate options"]
---

# Studying the Material

A craftsman who cannot read the material cannot shape it.
Before any decision is made, the material must be understood —
its properties, its limits, its grain, and what others have learned working with it.

**Principles:** YAGNI, KISS, DRY | Honest findings over comfortable ones | Concise, actionable reports

## Invariants

1. **Cap the searching at 5 tool calls**, fewer if the user says so. Think before each query;
   a sixth search is almost always re-reading what the first five already said.
2. **Cite or drop it.** Every claim in the report carries a link. A recalled fact with no source
   is the failure this skill exists to prevent — the searching is the point.
3. **Read the dates on what you find.** Stale guidance reads exactly like current guidance, and
   the gap is invisible unless you look. Say how old the evidence is when it matters.
4. **Rank, don't survey.** The output is a recommendation with its trade-offs priced, not a
   catalogue of options for the reader to choose between.
5. **Separate settled from contested.** Where the field disagrees, say so and say who is on
   which side, rather than picking one and presenting it as consensus.

## Searching

**Gemini toggle.** Read `skills.research.useGemini` from `.claude/.tkm.json` (or
`~/.claude/.tkm.json`); default `false`. Model from `gemini.model`, default
`gemini-3-flash-preview`.

When enabled, validate first — `command -v gemini && echo "ping" | timeout 15 gemini -y -m
<gemini.model>` — then run `echo "<prompt>" | timeout 180 gemini -y -m <gemini.model>` and save
the output, citations included, to the `Report:` path from `## Naming`. On validation failure or
timeout, fall back to WebSearch and warn once: "Gemini CLI unavailable, falling back to
WebSearch. Set `skills.research.useGemini: false` in `.claude/.tkm.json` to suppress this check."

When disabled or absent, use `WebSearch`. Run queries in parallel.

Aim at the primary record — official docs, the source repository, maintainers' own writing. For
a GitHub repo found along the way, read it through `tkm:search-docs`. Where recency matters,
put the current year in the query rather than a year hardcoded here.

### Stage 4: Produce the Study Report

**Notes:**
- Reports are saved using `Report:` path from `## Naming` section.
- If `## Naming` section is not available, ask the main agent to provide the output path.

Produce a comprehensive markdown report with this structure:

```markdown
# Study Report: [Topic]

## Summary
[2-3 paragraph overview of key findings and recommendations]

## Study Methodology
- Sources consulted: [number]
- Date range of materials: [earliest to most recent]
- Key search terms used: [list]

## Key Findings

### 1. Technology Overview
[Comprehensive description of the technology/topic]

### 2. Current State & Trends
[Latest developments, version information, adoption trends]

### 3. Established Practices
[Detailed list of recommended practices with explanations]

### 4. Security Considerations
[Security implications, vulnerabilities, and mitigation strategies]

### 5. Performance Characteristics
[Performance properties, optimization techniques, benchmarks]

## Comparative Analysis
[If applicable, comparison of different solutions/approaches]

## Recommendations

### Getting Started
[Step-by-step getting started instructions]

### Code Examples
[Relevant code snippets with explanations]

### Common Mistakes
[Errors to avoid and their remedies]

## Sources & References

### Official Documentation
- [Linked list of official docs]

### Recommended Reading
- [Curated list with descriptions]

### Community Resources
- [Forums, Discord servers, Stack Overflow tags]

### Further Study
- [Advanced topics and deep dives]

## Appendices

### A. Glossary
[Technical terms and definitions]

### B. Version Compatibility
[If applicable]

### C. Raw Study Notes
[Optional: detailed notes from the study process]
```

## Processing Level

Accepts `--level low|medium|high|max` (default: `medium`).
See `_shared/processing-levels.md` for global semantics.

| Level | Max searches | Cross-validation | Sub-agents | Deep content |
|-------|-------------|-----------------|-----------|-------------|
| `low` | 2 | No | None | No |
| `medium` *(default)* | 5 | Light | None | Optional |
| `high` | 8 | Full | Optional | Yes |
| `max` | Unlimited | Exhaustive | Parallel | Forced |

> The `IMPORTANT: Perform at most 5 researches` rule in Stage 2 applies at `medium`.
> `--level high` raises the cap to 8; `--level max` removes it.

## Where the domain changes the question

Security: pull the recent CVEs and advisories before concluding. Performance: insist on
benchmarks from real deployments, not vendor claims. Anything new: read the adoption curve and
the support commitment before betting on it. APIs: confirm the endpoints exist and the auth
story matches the docs. Aging technology: the deprecation notice and the migration path out are
part of the answer, never an omission.

## Output Requirements

**IMPORTANT:** Invoke "/tkm:organize-files" skill to organize the outputs.

The study report must:
1. Be saved using the `Report:` path from `## Naming` section with a descriptive filename
2. Include a timestamp of when the study was conducted
3. Provide clear section navigation for longer reports
4. Use code blocks with appropriate syntax highlighting
5. Include diagrams or architecture descriptions where helpful (Mermaid or ASCII)
6. Conclude with specific, actionable next steps

**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
