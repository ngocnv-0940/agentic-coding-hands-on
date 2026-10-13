---
name: tkm:predict-risks
description: "Five voices examine the plan before the first cut — expert personas debate architectural, security, performance, and UX risks in proposed changes. Use before major features or anything that cannot easily be undone."
argument-hint: "<change> [--level low|medium|high|max] [--files <glob>]"
metadata:
  author: takumi-agent-kit
  attribution: "Multi-persona prediction pattern adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "2.0.0"
module: testing-code-quality
triggers: ["risks", "what could go wrong", "before major change", "predict failure", "expert review of plan"]
---

# Predict Risks

Five trades size up the same proposal, each through its own craft, before the first cut.

Not for this skill: a plain bug (`tkm:debug-code`), a settled task (`tkm:create-plan`), a
dependency bump that leaves the API alone, or work already signed off.

## Processing level

`--level low|medium|high|max` (default `medium`) — see `_shared/processing-levels.md`.

| Level | Voices | Depth | Sub-agents | Output |
|---|---|---|---|---|
| `low` | 3 (Architect, Security, Devil) | Quick | None | Condensed |
| `medium` | All 5 | Standard | None | Full report |
| `high` | All 5 | Deep + code evidence | None | Full + confidence tags |
| `max` | All 5 | Deep | Parallel | Full + parallel debate |

`low` drops Performance and UX — the two that matter least to a quick spot check.

## The five voices

| Voice | Domain | What it asks |
|---|---|---|
| **Architect** | System design, scalability, coupling | Does this fit the architecture? Will it scale? What new coupling appears? |
| **Security** | Attack surface, data protection, auth | What can be abused? Where is data exposed? Are auth boundaries respected? |
| **Performance** | Latency, memory, queries, bundle size | Latency impact? N+1 queries? Memory leaks? Bundle bloat? |
| **UX** | Experience, accessibility, error states | Is this intuitive? What does the error state look like? Accessible on mobile? |
| **Devil's Advocate** | Hidden assumptions, simpler alternatives | Why not do nothing? What is the simplest alternative? Which assumption could be wrong? |

## Invariants

1. **Each voice reaches its verdict alone, before any of them compare notes.** The debate is
   worth holding only because the verdicts were formed independently.
2. **A report with no fault line is a failed debate, not a clean proposal.** Five lenses on one
   real change disagree somewhere — on priority if not on substance. If the draft has every
   voice nodding along, the voices were not actually applied; go back and find where two of
   them genuinely pull against each other.
   **The exception, and it is a real one:** a proposal below this skill's threshold — the patch
   bump, the settled task, the change with no design question in it — has no fault line because
   there is nothing to argue about. Say that plainly and return GO. Manufacturing a conflict to
   fill the table is the same failure as missing a real one, and it costs the reader more,
   because an inflated CAUTION teaches them to discount the next one.
3. **Anchor to the code when `--files` is given.** A risk stated against a real `file:line`
   outranks a risk stated against the proposal's wording. With no files, say plainly that the
   reading is proposal-level.
4. **Every risk carries a concrete mitigation.** "Monitor it closely" is not a mitigation.
5. **The verdict follows the STOP rules below, not the mood of the report.**
6. **Do not restate the proposal back.** The reader wrote it.

## Protocol

Read the proposal, and the affected code when paths are given → each voice forms its verdict
in isolation → collect the agreements and the fault lines → rule on each fault line, saying
which concern outweighs which and why → deliver GO / CAUTION / STOP with actions.

## Report format

```
## Risk Reading: [proposal title]

## Verdict: GO | CAUTION | STOP

### Where All Voices Agree
- [Point 1]

### Conflicts & Resolutions

| Topic | Architect | Security | Performance | UX | Devil's Advocate | Resolution |
|-------|-----------|----------|-------------|-----|-----------------|------------|
| [Issue] | [View] | [View] | [View] | [View] | [View] | [Recommendation] |

### Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| [Risk] | Critical/High/Medium/Low | [Concrete action] |

### Recommendations
1. [Action — rationale]
```

## Verdicts

| Verdict | Meaning |
|---|---|
| **GO** | Voices aligned, no critical risk, proceed |
| **CAUTION** | Real concerns, mitigations identified, proceed carefully |
| **STOP** | Critical unresolved issue — redesign or gather more information first |

**Any one of these forces STOP:** Security finds an auth bypass or data exposure with no
viable mitigation · Architect finds a fundamental design incompatibility needing rework ·
Performance finds unacceptable latency or query explosion with no workaround · Devil's
Advocate exposes a false assumption that invalidates the approach.

## Handoff

Recommendations become constraints for `tkm:create-plan`; CAUTION and STOP items become
acceptance gates for `tkm:takumi`.
