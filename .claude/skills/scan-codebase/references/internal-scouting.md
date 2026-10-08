# Internal Scouting with Explore Subagents

Fan out ONLY past the threshold in SKILL.md (6+ distinct areas, or candidate set exceeds your
remaining context budget). Below it, read directly — spawn overhead and summary-boundary
information loss make agents a net negative on small corpora.

## Graph Pre-Scout

If `graphify-out/graph.json` exists, run graph-first discovery per `../../_shared/graphify-code-graph.md`
and seed agent scopes from graph communities / affected files. Agents must verify graph leads with
source reads or targeted grep. Graph absent or stale → divide by directory instead.

## Spawning

- `subagent_type: "Explore"`, all agents in a single message for parallel execution
- Each agent gets a distinct, explicit scope (directories or files) — no overlap
- Respect the level's agent cap from SKILL.md

Prompt template:

```
Quickly scout {DIRECTORY} for files related to: {USER_PROMPT}

Instructions:
- Verify provided graph leads first, then Glob/Grep for missing areas
- List files with brief descriptions
- Timeout: 3 minutes max — return what you have

Report format:
## Found Files
- `path/file.ext` - description

## Patterns
- Key patterns observed
```

## Aggregation

1. Deduplicate paths, merge descriptions
2. Mark graph-derived but unverified items `graph-suggested`
3. Note timeouts/gaps; list unresolved questions
