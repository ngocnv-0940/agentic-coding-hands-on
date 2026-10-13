---
name: tkm:audit-security
description: "Harden the work against attackers — STRIDE + OWASP security audit with optional auto-fix. Scans code for vulnerabilities, categorizes by severity, and iteratively fixes findings."
argument-hint: "<scope|full> [--fix] [--level low|medium|high|max]"
metadata:
  author: takumi-agent-kit
  attribution: "Security audit pattern adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "2.0.0"
module: bug-fixing-debugging
triggers: ["security", "vulnerabilities", "OWASP", "harden", "security audit", "scan for exploits"]
---

# Audit Security

STRIDE against every entry point, OWASP against every data boundary, ranked so the worst crack
is fixed first.

| Mode | Invocation |
|---|---|
| Audit only | `/tkm:audit-security <scope>` |
| Audit + fix | `/tkm:audit-security <scope> --fix` |
| Bounded fix | `/tkm:audit-security <scope> --fix --iterations N` |

## Processing level

`--level low|medium|high|max` (default `medium`) — see `_shared/processing-levels.md`.

| Level | STRIDE | OWASP | Deps | Secrets | Static lint | Auto-fix |
|---|---|---|---|---|---|---|
| `low` | AI only | Yes | No | No | No | No |
| `medium` | Full | Yes | Yes | Yes | No | No |
| `high` | Full | Yes | Yes | Yes | Yes | No |
| `max` | Full | Yes | Yes | Yes | Yes | Implied |

`--level max` implies `--fix`; an explicit `--fix` wins regardless of level. `low` is a
pre-commit spot check, not a production audit.

## Invariants

1. **Every finding carries a real `file:line`.** No anchor, no finding — drop it. A security
   report that cannot be checked is worse than none, because it gets believed.
2. **Report this codebase, not the checklist.** The checklist is a prompt for where to look,
   never an inventory to hand back. "No rate limiting on auth endpoints" is a finding only
   when you have read the auth endpoints in this repo and they have none.
3. **Read the files before reasoning about them.** Resolve the scope into a concrete list and
   read every file in it first. A weakness inferred from a filename is a guess.
4. **Severity is exploitability here, not category prestige.** An injection sink reachable only
   from a local dev script is not Critical; a missing auth check on a public route is.
5. **Under `--fix`: one finding, one surgical change, guard after each.** The first guard
   failure stops the run and gets reported — never push on to the next finding.

## Method

1. **Scope** — resolve the glob or `full` into a file list; read them all.
2. **STRIDE** — walk the six categories against what you read. Checks per category:
   `references/stride-owasp-checklist.md`.
3. **OWASP** — pin each finding to a category A01–A10.
4. **Dependencies** — run the audit tool for the detected stack (`npm audit`, `pip-audit`,
   `govulncheck`, `bundle audit`). If a manifest or lockfile changed, also run
   `/tkm:audit-licenses` — watch `package.json`, lockfiles, `requirements*.txt`,
   `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`,
   `composer.json`, `mix.exs`, `DESCRIPTION`.
5. **Static lint** — at `high`/`max`, `/tkm:lint-code --security`. SunLint security errors are
   blocking findings; warnings go in the report unless project policy blocks on them.
6. **Secrets** — sweep with the regex set in `references/stride-owasp-checklist.md` →
   Secret Patterns. That set is the authority; do not substitute a looser keyword match.

## Output format

```
## Security Audit Report

### Summary
- Files scanned: N
- Findings: X critical, Y high, Z medium, W low, V info

### Findings

| # | Severity | Category | File:Line | Description | Fix Recommendation |
|---|----------|----------|-----------|-------------|-------------------|
| 1 | Critical | Injection | api/users.ts:45 | SQL string concatenation | Use parameterized queries |
| 2 | High     | Auth      | auth/login.ts:12 | No rate limiting | Add express-rate-limit |
```

Severity drives order: Critical blocks release, High is this sprint, Medium next, Low backlog,
Info optional.

## Fix mode

Worst-first. Per finding: one surgical change, no wider than the finding → run the guard
(tests or lint) → commit `security(fix-N): <short description>` → next. Guard fails, run stops.
Regression safety follows the `tkm:auto-research` guard pattern. `--iterations N` caps the run.

## Handoffs

A security flag from `tkm:predict-risks` justifies an audit. Critical/High can be driven to
remediation by `tkm:auto-research --fix`; Medium/Low belong in `tkm:create-plan` as sprint work.
