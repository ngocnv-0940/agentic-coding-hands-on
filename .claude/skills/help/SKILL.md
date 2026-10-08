---
name: tkm:help
description: "Navigate the Takumi kit — find the right skill, the right workflow, and understand why. Activate when the user is unsure which skill to use, asks 'how do I do X', or reaches for the wrong tool for their task."
argument-hint: "[task description | skill-name | --list | --workflow]"
metadata:
  author: takumi-agent-kit
  version: "1.1.0"
module: configuration-level
triggers: ["help", "list skills", "what skills", "skill catalog", "which skill", "capabilities"]
---

# Help

Read the commission, name the one right skill, say why, and warn off the likeliest wrong turn.

## Modes

| Invocation | Behavior |
|------------|----------|
| `/tkm:help "I want to X"` | Recommend the right skill + workflow for your task |
| `/tkm:help --list` | Show all skills organized by domain |
| `/tkm:help --workflow` | Show all standard workflow chains |
| `/tkm:help <skill-name>` | Deep explanation of a specific skill (e.g. `brainstorm`) |
| `/tkm:help` (no args) | Ask what you're trying to accomplish |

## Process

### When `$ARGUMENTS` contains `--list`
Load: `references/skill-catalog.md`
Display all skills grouped by domain as a table with one-line descriptions.

### When `$ARGUMENTS` contains `--workflow`
Load: `references/workflow-patterns.md`
Display all standard workflow chains with trigger phrases.

### When `$ARGUMENTS` matches an exact skill name (e.g. `brainstorm`, `fix-bug`, `design-to-code`, `lint-code`, `audit-licenses`)
Load: `references/skill-catalog.md` when needed to verify current skill names and avoid stale answers.

Provide inline deep explanation:
- What it does (1 sentence)
- When to use it (3-5 bullet trigger phrases)
- What it outputs
- Full workflow context
- What NOT to confuse it with

### When `$ARGUMENTS` is a task description
Load: `references/intent-patterns.md`
Load: `references/anti-patterns.md`

1. Parse the natural language description
2. Identify the primary intent domain (design, implement, debug, deploy, etc.)
3. Match against intent patterns to find the best skill
4. Format the recommendation (see Output Format below)

### When `$ARGUMENTS` is empty
Use `AskUserQuestion` with:
- Question: "What are you trying to accomplish?"
- Header: "Task type"
- Options:
  1. **Design / Build UI** — replicate design, build interface, style components
  2. **Implement a feature** — build new functionality, execute a plan
  3. **Fix a bug or error** — something is broken, CI failing, unexpected behavior
  4. **Quality gate** — tests, lint, code review, security, or license audit
  5. **Other** — deploy, plan, research, document, ship, etc.

After selection, treat the answer as a task description and apply intent matching.

## Output Format

### Standard Recommendation
```
## Skill Recommendation: /tkm:<skill>

**Your task:** [echo the task concisely]

**Why this skill:** [1-2 sentences explaining the match — opinionated, direct]

**Invoke:**
/tkm:<skill> <example arguments>

**Suggested workflow:**
`/tkm:scan-codebase` → `/tkm:<skill>` → `/tkm:run-tests` → `/tkm:ship`

**Don't use:**
- ❌ `/tkm:<wrong-skill>` — [specific reason this is wrong for this task]

**Related:** `/tkm:<alt>` (for [edge case X])
```

### --list Mode
Display as: domain heading → markdown table (Skill | When to Use | Triggers)

### --workflow Mode
Display as: pattern name → chain → trigger phrases → when to deviate

## Invariants

1. **Route on what the user has and what they want produced**, never on the words they chose.
   "Redesign this page" with a screenshot attached and "redesign this page" with nothing
   attached go to two different skills.
2. **One primary recommendation.** A list of three is the guide refusing to guide.
3. **Name the skill that would have been the wrong turn**, and why it is wrong for *this*
   task — the confusable neighbour is the whole reason someone asked.
4. **Verify the name against `references/skill-catalog.md`** before recommending it. A
   confidently named skill that does not exist costs more than saying you are unsure.
5. **Language does not change routing.** Vietnamese, Japanese and English queries reach the
   same skill; answer in the language asked.
