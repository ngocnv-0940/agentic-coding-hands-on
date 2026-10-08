---
name: tkm:capture-lessons
description: "Capture the lessons of the session — decisions made, failures and their root causes, what to do differently. Activate at the end of any significant work session or implementation cycle. (Formerly tkm:write-journal.)"
argument-hint: "[topic or reflection]"
metadata:
  author: takumi-agent-kit
  version: "2.0.0"
module: documentation-knowledge
triggers: ["capture lessons", "lessons learned", "journal", "write up session", "wrap up", "document what we did", "session notes", "write-journal"]
---

# Capture Lessons

A craftsman's work does not end when the piece leaves the workshop.
Every session deserves a record: what was shaped, what was learned, what would be done differently.

Hand the work to the `journal-writer` subagent: let it sift the recent code changes and the
shape of the session, then set down tight entries that hold the decisions made, what they
moved, and the notes worth keeping about the craft itself.

Lay these entries down in the `./docs/journals/` directory.
Keep each one lean — the moments that mattered, never a blow-by-blow of everything that happened.

**IMPORTANT:** Invoke "/tkm:organize-files" skill to organize the outputs.
