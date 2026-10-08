# Branch Management

## Naming

`<type>/<descriptive-name>` — types: `feature/` `fix/` `refactor/` `docs/` `test/` `chore/`
`hotfix/`. Example: `feature/oauth-login`, `hotfix/payment-crash`.

## Protected branches

Never force-push to `main`, `master`, `production`, `prod`, `release/*`. Never delete them.
Branch off the protected branch rather than committing to it directly.

## Worktrees

For parallel work in one repo, prefer a worktree over switching branches — it avoids a dirty
tree and lets two tasks run at once. `tkm:create-worktree` owns that flow.

The stash stack is shared across worktrees. A bare `git stash pop` can take another session's
entry; use `git stash push -u -m "<tag>"`, then apply by SHA.

## Cleanup

Delete the local and remote branch once its PR is merged. A branch that outlives its PR turns
into a stale base someone will eventually branch from by mistake.
