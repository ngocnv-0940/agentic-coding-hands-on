# Intent Patterns — Natural Language → Skill Routing

Match on what the user **has** and what they **want produced**, not on the words they used.
Queries arrive in English, Vietnamese or Japanese; routing does not change with the language.

**Depth signal:** a request for a "quick/light" or "thorough/exhaustive/critical" pass on a
depth-sensitive skill (`research`, `scan-codebase`, `brainstorm`, `review-code`,
`audit-security`, `debug-code`, `predict-risks`, `propose-improvements`) appends
`--level low|medium|high|max`, default `medium`.

## Design & frontend

| They have / want | Route to | Not this if |
|---|---|---|
| An existing asset — mockup, screenshot, Figma link, video, HTML — to turn into code | `design-to-code` | No asset, and the look is still undecided → `design-ui` |
| No asset; the interface still has to be decided (style, palette, type, layout) | `design-ui` | An asset exists → `design-to-code` |
| React/TypeScript or Next.js components to build | `build-frontend` | |

## Implementation

| They have / want | Route to | Not this if |
|---|---|---|
| A feature built end to end | `takumi` (`--fast` when they ask for quick) | |
| A blueprint only, no code written | `create-plan` | They expect working code → `takumi` |
| A decision weighed between routes, any advisor lens | `brainstorm` | They want the work done, not the choice made |
| A technology or library compared and ranked | `research` | |

## Bugs and debugging

| They have / want | Route to | Not this if |
|---|---|---|
| A known defect to repair | `fix-bug` | |
| Unexplained behaviour whose cause is unknown | `debug-code` | The cause is already known → `fix-bug` |
| Vulnerabilities found and ranked | `audit-security` | Dependency licences, not code → `audit-licenses` |

## Testing and quality

| They have / want | Route to | Not this if |
|---|---|---|
| Test suites run, coverage read | `run-tests` | |
| Static analysis over the code | `lint-code` | They want a human-style read of a diff or PR → `review-code` |
| A diff, PR or branch reviewed with judgement | `review-code` | |
| Dependency licence compatibility checked | `audit-licenses` | Code vulnerabilities or OWASP → `audit-security` |

## Delivery

| They have / want | Route to | Not this if |
|---|---|---|
| The app live on a platform | `deploy-app` | |
| A finished branch taken through the pipeline | `ship` | |
| Commits, pushes, PRs | `git` | |
| Isolated parallel work in one repo | `create-worktree` | |

## Documentation and understanding

| They have / want | Route to | Not this if |
|---|---|---|
| Project docs brought back in line with the code | `manage-docs` | |
| The session recorded before it ends | `capture-lessons` | |
| A diagram rendered | `preview-output --diagram` | |
| The codebase mapped, files located | `scan-codebase` | |
| A question answered about this project | `ask-expert` | |

## Kit itself

| They have / want | Route to | Not this if |
|---|---|---|
| An installed skill improved or extended without editing it | `kaizen` | |
| A different explanation depth from now on | `set-level` | |
| A way forward when two attempts have already failed | `solve-problem` | A plain defect → `debug-code` |

## Extras kit

| They have / want | Route to | Not this if |
|---|---|---|
| Effort estimated from a spec, or from Clio KG | `estimate` (auto-detects clio mode) | |
| Historical estimates imported, or the knowledge base calibrated | `estimate import` / `estimate calibrate` | |
| Questions asked before estimating | `estimate discovery` | |
| A document, spreadsheet or book translated | `translate-file` | Creating or editing office files rather than translating → `document-skills` |

## When the intent spans domains

Recommend the primary skill, then name the next step.

| Pattern | Primary | Next |
|---|---|---|
| design and implement X | `design-ui` or `design-to-code` | `takumi` |
| plan and build X | `create-plan` | `takumi plan.md` |
| fix and deploy | `fix-bug` | `ship` |
| review and merge | `review-code` | `ship` |
