---
name: tkm:consult
description: "Interactive advisory skill — interviews you one question at a time to reframe a fuzzy idea or request into exact requirements and goals, then gives honest, direct advice: what to do, what to avoid, a cheaper path, trade-offs, and a work checklist. Use consult when the ask is still fuzzy and you want the user in the loop; use ask-expert for Q&A-with-citations about an EXISTING project; use athena (agent) for autonomous one-shot counsel with no interview."
argument-hint: "<idea|question> [--grill] [--yagni]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
module: ai-collaboration
triggers: ["advise", "tư vấn", "reframe idea", "nên làm gì", "phản biện ý tưởng", "second opinion", "is this a good idea", "should I build this"]
---

# Consult — Reframe, Then Advise

Most requests that come in fuzzy are not missing information so much as missing a real question.
`consult` does not answer the idea as stated — it interviews first, converges on the exact
requirement and goal underneath it, then delivers a verdict the requester can act on. Be honest,
be brutal, be concise. Agreement is not the job; a call that holds up is.

Idea/question:
<idea>$ARGUMENTS</idea>

## Flow

1. **Reframe by interview** — probe what is actually being asked: the real constraint, the actual
   goal, who it serves, what "done" looks like. Don't accept the first framing as the brief.
2. **Converge — explicit gate** — once the interview stops surfacing new decisions (or the user
   says proceed), state the reframed requirement and goal back in one or two lines and **wait for
   the user to confirm it** (an explicit "yes/proceed" or a correction). Do not advise on an
   unconfirmed reframe; if the user corrects it, fold that in and re-confirm before moving on.
3. **Deliver advice** — only after the reframe is confirmed, produce the Output Contract below
   against the converged requirement, not the original fuzzy ask.

## The Interview

- Default (no `--grill`): batch questions via `AskUserQuestion`, honoring the `## Plan Context`
  injected `questions={min}-{max}` bound.
- `--grill`: load `../../rules/grill-loop-protocol.md` and run it as written — one question at a
  time, sink = this session's working notes, recorded as each decision crystallizes. Do not
  restate its algorithm here; that file is the single source of truth for the loop.
- Scout first: anything answerable by reading the repo (existing docs, code, prior plans) is read,
  not asked. Ground every load-bearing claim in real source (`file:line`), and in the advice keep
  what you **verified** (scouted code, fetched docs) separate from what you **believe** — label
  speculation as such.

## `--yagni`

When passed, challenge every piece of scope in the idea that isn't needed for the stated outcome
and cut it before advising — fold that cut directly into **Verdict** and **Cheaper/better path**,
don't just append a note.

## Output Contract

Close every consult with, in this order:

1. **Reframed ask** — the exact requirement/goal the interview converged on (one or two lines).
2. **Do** — the concrete path to take.
3. **Don't** — the traps and tempting-but-wrong turns.
4. **Cheaper/better path** — the lower-cost or lower-risk alternative, if one exists; say plainly
   if there isn't one.
5. **Benefits** — what taking the recommended path actually buys.
6. **Trade-offs** — the honest cost, compared on the worst plausible case, not the best.
7. **Work checklist + success metrics** — steps small enough to hand straight to
   `/tkm:create-plan` or `/tkm:takumi`, each paired with the signal that confirms it worked.
8. **Verdict** — the honest take, last. Say plainly if the idea is weak, over-engineered, or
   premature. Tag its certainty with the `tkm:confidence` taxonomy
   (`[EXTRACTED:0.9]` / `[INFERRED:0.7]` / `[AMBIGUOUS:0.3]`).

## Finish

Close the consult with one explicit line so the caller (or an orchestrator) knows the advisory is
complete and what comes next:

```
CONSULT_DONE — verdict: <build it | don't | needs a fork decision> → next: <e.g. /tkm:create-plan, /tkm:brainstorm, or stop>
```

If the interview never converged (the user left, or a user-only fork stayed open), say so plainly
instead of forcing a verdict: `CONSULT_INCOMPLETE — <what is still unresolved>`.

## Boundary

`consult` reframes a still-fuzzy ask through an interactive interview, then advises — distinct from
`tkm:ask-expert` (cited Q&A over an existing project, no interview) and the `athena` agent
(autonomous one-shot counsel, no user in the loop). The authoritative side-by-side definition of
the three advisory roles lives in `../../rules/orchestration-protocol.md` → "Advisory Escalation";
read it there rather than trusting a second copy here.

## Workflow Position

Precedes `/tkm:create-plan` or `/tkm:takumi` when the verdict is "build it." Precedes
`/tkm:brainstorm` when the verdict surfaces a real architecture fork worth a deeper trade-off
pass. Closing an idea that doesn't clear the bar is itself a valid, complete outcome.
