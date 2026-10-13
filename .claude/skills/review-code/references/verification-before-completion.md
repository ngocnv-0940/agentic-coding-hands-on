# Verification Before Completion

**Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

A claim about the code's state is only as good as the run that produced it — in THIS session,
AFTER the last change. Stale evidence is no evidence.

## The Gate (before any "done", commit, or PR)

1. **IDENTIFY** the command that proves the claim (test suite, build, repro script).
2. **RUN** it — fully, not a subset you expect to pass.
3. **READ** the output — exit code AND content (a green exit with skipped tests proves nothing).
4. **VERIFY** the output confirms the specific claim.
5. Only then claim — and state the evidence with it.

## What requires the gate

| Claim | Required evidence |
|---|---|
| Tests pass | Full run output, 0 failures |
| Build succeeds | Exit 0 from the build command |
| Bug fixed | Original symptom re-run: fails before, passes after |
| Requirements met | Each requirement checked against code, not memory |

## Excuse → Reality

| The whisper | The rule |
|---|---|
| "Should pass now" / "probably works" | Run it. "Should" is a guess in formal wear. |
| "I only changed a comment/string" | Cheap to verify. Run it anyway. |
| "The subagent said it passed" | Agent reports are claims, not evidence. Re-run or read the artifact. |
| "I verified earlier" | Earlier is stale the moment anything changed. Fresh run only. |

Warning signs you are about to violate the gate: "should", "probably", "seems to",
satisfaction before verification, trusting reports without running commands.
