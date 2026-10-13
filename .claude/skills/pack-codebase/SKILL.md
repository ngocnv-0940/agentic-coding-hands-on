---
name: tkm:pack-codebase
description: Fold a whole repository into one Repomix file an LLM can read (XML, Markdown, or plain text). Reach for it when you need a codebase snapshot, want to hand a model full context, are prepping a security audit, or studying someone else's library.
argument-hint: "[path] [--style xml|markdown|plain|json]"
metadata:
  author: takumi-agent-kit
  version: "2.0.0"
module: specialized-output
triggers: ["pack codebase", "repomix", "LLM context", "codebase snapshot"]
---

# Pack Codebase

Flatten a repository into one file a model can read, via Repomix. The craft is in what you
leave out: pack too little and the structure breaks, too much and the signal drowns.

## Preflight

```bash
repomix --version || npm install -g repomix   # or: brew install repomix
```

## Invariants

1. **Measure before you select — but read the tree by depth, not whole.**
   `--token-count-tree` prints every node above the threshold: on a large repo that is
   thousands of lines, and raising the threshold barely shortens it (django: 5.0k lines at
   1000, still 1.8k at 100000). Reading it whole burns the budget you came to save. Instead:

   ```bash
   repomix --token-count-tree 1000 > /tmp/tree.txt
   grep -E '^[├└]── ' /tmp/tree.txt            # depth 1 — where the weight sits
   grep -E '^│   [├└]── ' /tmp/tree.txt        # depth 2 of the heavy branch
   ```
   Two reads settle the selection. One measuring pass, one packing pass is the normal shape;
   do not iterate to hit a number exactly.
2. **Fit the context window of the RECIPIENT model**, not a remembered number. Check that
   model's current limit; do not pack against a ceiling you assume.
3. **The security scan stays on.** Secretlint runs by default. `--no-security-check` only for a
   confirmed false positive, never to make a run finish.
4. **Read the output before it leaves the machine.** Repomix will happily bundle anything git
   does not ignore.
5. **Report the token total with the artifact.** A bundle handed over without its size is
   unusable — the recipient cannot tell whether it fits.

## Flags that matter

| Flag | Effect |
|---|---|
| `--style xml\|markdown\|json\|plain` | Output shape. XML is default and the most machine-unambiguous |
| `--include "src/**/*.ts,*.md"` · `-i "tests/**"` | Select / exclude by glob (`-i` adds to .gitignore) |
| `--remove-comments` | Strips comments in the languages it parses — a large cut on commented codebases |
| `--token-count-tree [N]` | Per-node token tree; `N` hides everything under N tokens |
| `--remote owner/repo` | Pack a public repo without cloning. Accepts a full URL or a `/commit/<sha>` URL |
| `--no-gitignore` · `--no-default-patterns` | Escape hatches when expected files are missing |
| `-o <path>` · `--copy` | Write to a path / to the clipboard |
| `-c <file>` · `--init` | Use / create `repomix.config.json` |

Private remote repos are not supported — clone first, then pack locally.

## When it goes wrong

| Symptom | Move |
|---|---|
| Bundle overshoots the target window | `--token-count-tree` → narrow `--include` → `--remove-comments` → `--no-line-numbers` |
| Expected files absent | Check `.gitignore` + `.repomixignore`, then `--no-gitignore --no-default-patterns --verbose` |
| Secret flagged | Read the flagged file → move it to `.repomixignore` or out of source. Disabling the scan is the last resort, not the first |
| Crawls on a big tree | Exclude `node_modules/**,dist/**,vendor/**` before narrowing further |

## Output contract

Lead with the security result: **name every file the scan flagged** and say what happened to
it — never hand over a bundle with that buried or implied. Then one line each: output path ·
total token count · the window it was sized for and where that figure came from. Ordinary
exclusions (vendor dirs, build output, docs you dropped for size) are summarised in a phrase —
those are the ones not worth enumerating. A flagged file is not an ordinary exclusion.

## References

- `references/configuration.md` — config file schema, glob precedence, `.repomixignore`, output formats
