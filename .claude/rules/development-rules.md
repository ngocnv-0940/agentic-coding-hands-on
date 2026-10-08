# Development Rules

**IMPORTANT:** Read the skills catalog and turn on whatever skills the work in front of you calls for.
**IMPORTANT:** Three principles ride along on every change: **YAGNI (You Aren't Gonna Need It) — KISS (Keep It Simple, Stupid) — DRY (Don't Repeat Yourself)**.
**IMPORTANT:** The craftsman disposition behind these rules — voice, the Study→Deliver flow, Iron Laws, confidence taxonomy — lives in `.claude/ethos/ETHOS.md`. Read it when an artifact's voice or judgment is in question.

## General
- **File Naming**: Name files in kebab-case, and let the name say plainly what the file is for. Length is fine — a long, self-describing name pays off the moment an LLM scans the tree with Grep or similar and grasps the purpose without opening the file.
- **File Size Management**: Hold each code file under 200 lines so context stays manageable.
  - Break oversized files into smaller, single-purpose modules or components.
  - Reach for composition over inheritance when a widget grows complicated.
  - Pull utility functions out into their own modules.
  - Give business logic its own dedicated service classes.
- Need current library docs? Turn on the `tkm:search-docs` skill (it sits on top of `context7`) to pull the latest.
- Reach for the `gh` bash command when you need to drive GitHub.
- Reach for the `psql` bash command when debugging means querying a Postgres database.
- Use the built-in Read tool to open and describe images, screenshots, and documents directly when that helps.
- Lean on the `tkm:think-sequential` and `tkm:debug-code` skills for step-by-step reasoning, code analysis, and debugging when the task warrants it.
- **[IMPORTANT]** Honor the codebase structure and code standards documented in `./docs` as you build.
- **[IMPORTANT]** Write the real implementation — never fake it or stub it out as a stand-in.

## Code Quality Guidelines
- Read `./docs` for codebase structure and code standards, and follow them.
- Don't be a zealot about lint, but **leave no syntax errors — the code must compile**.
- Favor working, readable code over rigid style policing and formatting fussiness.
- Apply sensible quality bars — the kind that keep developers productive, not bogged down.
- Wrap risky paths in try/catch and keep security standards in view.
- Hand finished work to a reviewer after every implementation — rendered from `skills/_shared/templates/reviewer-prompt-template.md`; there is no `reviewer` agent type.

## Pre-commit/Push Rules
- Lint before you commit.
- Run the tests before you push — and DO NOT wave through failing tests just to make the build or GitHub Actions green.
- Keep each commit scoped to the actual code change.
- **DO NOT** commit or push secrets of any kind (dotenv files, API keys, database credentials, and the like) to the repository.
- Write clean, professional commit messages in conventional-commit form, with no AI references.

## Code Implementation
- Write code that is clean, readable, and easy to maintain.
- Stay within the architectural patterns already in place.
- Build features to spec.
- Account for edge cases and error paths.
- **DO NOT** spin up new "enhanced" copies of files — edit the existing files in place.

## Test Scope & the Scope Contract
Minimal test for maximum confidence — never blanket coverage. Before verifying any change,
state a **Scope Contract** (four lines, cheap to write):

- **Changed** — the files and behaviors this change actually touches.
- **Impacted** — what could break downstream: callers of changed functions, shared contracts.
- **Will verify** — what gets tested, at which layer, and why that layer is enough.
- **Deliberately skipped** — what is not re-tested this run, and why it is safe to leave.

For a trivially bounded change — docs-only, a copy tweak, a single cosmetic edit — verify only
the touched surface (does the page build, does the text read right); do not drag the whole
suite, the linter, or a coverage sweep into it. Nobody is served by testing what the change
never reached.

Two rules override the contract and are never negotiable:

- **Fail open.** Unsure whether something is impacted? Test it. A selector that cannot decide
  runs the wider set, not the narrower one — slower beats a silent miss.
- **Safety-critical always runs in full**, whatever the contract says, whenever the change
  touches any of: authentication / authorization / permissions / RBAC; sessions, tokens,
  secrets, or crypto; payment or billing; database migrations, schema, or data mutations;
  cross-service calls, API contracts, or other public interfaces; config, CI, release, or
  deploy; and the kit's own lifecycle hooks (`claude/hooks/*.cjs`).

This list is the **single source of truth** for "safety-critical" — other rules and agents
point here rather than restating it.

## Before Adding a Test
- A test must protect observable behavior, a contract, or a credible regression — the smallest test that reliably proves it.
- Not every change needs a new test: renames, copy, config, docs, and pure refactors usually need none. Cover the paths the change puts at risk, not every edge.
- One owner test per contract at its strongest boundary; extend an existing case over a near-duplicate. No exports/wrappers/seams that only tests use.
- Bug fixes: the regression test must fail on the pre-fix code for the intended reason.
- Full procedure (four-question gate + junk patterns + keep-list): `../skills/run-tests/references/authoring-gate.md`.

## Visual Aids
- Reach for `/tkm:preview-output --explain` when walking through an unfamiliar pattern or tangled logic.
- Reach for `/tkm:preview-output --diagram` for architecture diagrams and data-flow pictures.
- Reach for `/tkm:preview-output --slides` for step-by-step walkthroughs and presentations.
- Reach for `/tkm:preview-output --ascii` for terminal-friendly diagrams (no browser needed to follow them).
- Append `--html` to any generation flag for a self-contained HTML file that opens in the browser with no server.
- **Plan context:** the active plan comes from the `## Plan Context` block injected by the hook; visuals land in `{plan_dir}/visuals/`.
- With no active plan, fall back to the `plans/visuals/` directory.
- For Mermaid diagrams, the `/mermaidjs-v11` skill carries the v11 syntax rules.
- For how this folds into the larger flow, see `primary-workflow.md` → Step 6.
