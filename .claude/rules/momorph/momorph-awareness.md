# MoMorph Awareness Rules

Treat a task as MoMorph when the user message, active plan, or task prompt contains a URL
`https://momorph.ai/files/{fileKey}/screens/{screenId}`, explicit `fileKey`/`screenId` values, or
the keyword "momorph" / "figma".

When detected:
1. Require the extras kit (`momorph-implement-design` skill + `momorph-ui-implementer` agent). If
   either is missing, STOP and tell the user to run `tkm init --kit extras`.
2. Never route MoMorph UI work to generic `implementer`.
3. Before planning (`tkm:create-plan`), implementing (`tkm:takumi`), or delegating, read and follow
   `momorph-implement-design/references/momorph-workflow.md` (extras skill) — clarification gate, test policy, Track A/B, and the delegation block every sub-agent prompt
   must carry.
