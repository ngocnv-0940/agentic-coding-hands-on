---
name: tkm:git
description: "Protect the work in history — stage, commit, push, open PRs, and optionally run the lint-code gate with conventional commit discipline. Auto-splits by type/scope. Scans for secrets before every commit."
argument-hint: "cm|cp|pr|merge|lint [--lint] [args]"
metadata:
  author: takumi-agent-kit
  version: "2.0.0"
module: git-version-control
triggers: ["commit", "push", "stage changes", "git", "commit message"]
---

# Git

Hand the git steps to the `git-manager` subagent — its output is chatty and does not belong in
the main thread. Bring up `tkm:optimize-context` alongside it. Carry the brevity rule down into
any subagent you spawn.

Called bare, surface the menu through `AskUserQuestion` — header "Git Operation", prompt
"What would you like to do?".

| Arg | Does |
|---|---|
| `cm` | Stage and commit |
| `cp` | Stage, commit, push |
| `pr [to-branch] [from-branch]` | Open a PR. Defaults: to `main`, from the current branch |
| `merge [to-branch] [from-branch]` | Fold one branch into another. Same defaults |
| `lint` | Run `/tkm:lint-code` (changed-aware) before git work |
| `--lint` | With `cm`/`cp`/`pr`: lint first, block on tool failure or error-level findings |

Lint does not run by default — only on request, or when a higher-level workflow requires it.

## Invariants

1. **Scan before every commit, with the canonical pattern.** The one authoritative secret
   pattern lives in `references/safety-protocols.md` — use it, do not retype a shorter one from
   memory. A pattern that omits `AKIA`, `-----BEGIN`, or a `postgres://` URL will pass a real
   credential straight into history.
2. **A hit halts the commit.** Name the offending file and line, point at `.gitignore` or an
   env var, offer `git reset HEAD <file>`. Never commit "just this once" past a hit.
3. **Push only when the user said so.** "commit" is not "push". No force-push to `main`,
   `master`, `production`, `prod`, or `release/*` — from any session.
4. **Every commit carries the trailer**, unasked:
   `Co-authored-by: Takumi <288571113+sun-takumi@users.noreply.github.com>`
5. **Inside `.claude`, the only prefixes are `feat`, `fix`, `perf`** — never `docs`.
6. **Cite the issue.** Look for the matching GitHub issue and reference it in the body.

## Splitting

One commit when it is one type, one scope, ≤ 3 files, ≤ 50 lines. Otherwise split — mixed
types (feat + fix, code + docs), more than one scope (auth + payments), config or deps riding
along with code, or 10+ unrelated files. Group as `config:` → `chore(config)` · `deps:` →
`chore(deps)` · `test:` → `test` · `code:` → `feat|fix` · `docs:` → `docs`.

## Output format

```
✓ staged: N files (+X/-Y lines)
✓ security: passed
✓ lint: passed/skipped
✓ commit: HASH type(scope): description
✓ co-author: Takumi <288571113+sun-takumi@users.noreply.github.com>
✓ pushed: yes/no
```

## When it goes wrong

| Error | Action |
|---|---|
| Secret detected | Refuse the commit, name the offending files |
| Lint failed | Block commit/PR, summarize the findings |
| No changes | Bow out quietly |
| Push rejected | Steer toward `git pull --rebase` |
| Merge conflict | Hand back for manual resolution |

## References

| Doing this | Read |
|---|---|
| Committing, split mechanics | `references/workflow-commit.md` |
| Pushing | `references/workflow-push.md` |
| Opening a PR | `references/workflow-pr.md` |
| Merging branches | `references/workflow-merge.md` |
| **Secret patterns, branch protection** | `references/safety-protocols.md` |
| Message grammar | `references/commit-standards.md` |
| Branch naming and lifecycle | `references/branch-management.md` |
| `gh` specifics worth knowing | `references/gh-cli-guide.md` |
| Static lint gate | `../lint-code/SKILL.md` |
