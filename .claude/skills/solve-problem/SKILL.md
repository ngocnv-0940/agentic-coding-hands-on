---
name: tkm:solve-problem
description: When the work refuses to move — a tangle that keeps growing, a problem that has already eaten three attempts — reach here. Named techniques for the distinct ways a problem stalls: complexity spirals, innovation blocks, repeating patterns, assumptions that box you in, simplification cascades, and scale uncertainty.
argument-hint: "[problem description]"
metadata:
  author: takumi-agent-kit
  version: "3.0.0"
module: specialized-output
triggers: ["stuck", "can't figure out", "recurring problem", "break the pattern"]
---

# Solve Problem

A jam is not one thing. Name which kind it is, take the move that answers it, and stop
re-running the approach that already failed.

## Dispatch — read the symptom, take the move

| Symptom | Move | Full technique |
|---|---|---|
| Same thing built 5+ ways · special cases multiplying · branches everywhere | **Simplification Cascades** — find the one insight that deletes X, Y and Z together | `references/simplification-cascades.md` |
| Conventional answers all fall short · need a genuine leap | **Collision-Zone Thinking** — force an unrelated domain onto this one, keep what emerges | `references/collision-zone-thinking.md` |
| Same trouble surfacing in different corners · solved fresh each time | **Meta-Pattern Recognition** — abstract the pattern behind the instances | `references/meta-pattern-recognition.md` |
| The fix feels forced · "it has to be done this way" | **Inversion Exercise** — assume the opposite and see which constraint was never real | `references/inversion-exercise.md` |
| Unsure it holds in production · edge cases still dark | **Scale Game** — push to 1000× and to 1×, read what breaks | `references/scale-game.md` |
| Code is simply broken — wrong output, failing test | Not a stuck-type. Use `tkm:debug-code` | — |

Pick one. Reach for a second only after the first stalls.

## Pairings that earn their keep

- **Meta-pattern → Simplification** — name the shared pattern, then collapse every instance of it.
- **Collision → Inversion** — borrow the metaphor, then flip the assumptions it smuggled in.
- **Scale → Simplification** — push to the extreme; whatever survives shows what you can cut.

## Invariants

1. **The failed approach is out.** Re-proposing it in new wording is not a fresh angle.
2. **Ground every angle in the actual code** — a real `file:line`, not a plausible-sounding design.
3. **One move at a time.** Stacking two before either has run turns analysis into noise.
4. **Record the dead ends too.** The caller (`tkm:fix-bug`, `tkm:debug-code`, `debugger`) needs to
   know what was eliminated, not just what is proposed.

## When every move comes up empty

Reframe (is this even the right problem?) → shrink the scope (crack a smaller version first)
→ interrogate the constraints (real, or assumed?) → bring the user in with what was eliminated.

## Output contract

Report back with: the stuck-type named · the move applied · **2+ genuinely distinct angles**,
each with its `file:line` anchor and its cost · what was eliminated and on what evidence ·
one recommendation. No angle without an anchor.
