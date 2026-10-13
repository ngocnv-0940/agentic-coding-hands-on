# gh CLI — the parts worth writing down

`gh` is self-documenting (`gh <cmd> --help`); only the non-obvious lives here.

## PR body from a heredoc

A `--body` containing newlines, backticks or `$` needs a **quoted** heredoc delimiter, or the
shell expands it before `gh` ever sees it:

```bash
gh pr create --base dev --title "feat(auth): add OAuth" --body "$(cat <<'BODY'
## Summary
- Wired in the OAuth2 provider

## Test plan
- [ ] Unit suite green
BODY
)"
```

The quotes around `'BODY'` are the whole point. Unquoted, the shell eats `$VAR` and backticks.

## Gotchas

- **Base branch**: `--base` falls back to the repo's default branch, which is `dev` in this
  org rather than `main`. State it explicitly instead of trusting the default.
- **Project scope**: `gh project` needs a token carrying `project` scope. On a scope error the
  user runs `gh auth refresh -s project --hostname github.com` themselves — it is interactive,
  so you cannot run it for them.
- **`--json` fields** differ per command. `gh <cmd> --json` with no value prints the valid
  field names for that command.
- **Draft PRs**: `--draft` does not combine with `--ready`; convert afterwards via
  `gh pr ready`.

## Reading a PR or a CI run without cloning

```bash
gh pr view <n> --json title,body,files,reviews
gh pr diff <n>
gh run list --branch <branch> --limit 5      # CI state for a branch
gh run view <run-id> --log-failed            # only the failing step's log
```
