---
name: tkm:audio-transcribe
description: "Transcribe audio/video to SRT subtitles then revise with Claude's own intelligence — no external LLM API required. Reads context documents to extract domain terms, calls the Audio Transcribe REST API with a per-user API key, then Claude directly corrects mis-transcriptions. Use for meetings, demos, lectures, interviews; especially effective with domain PDFs (product specs, slide decks, terminology glossaries)."
category: content
roles: [pm, analyst]
argument-hint: "<file> [--language vi,en,ja] [--context <docs>] [--output out.srt]"
metadata:
  author: takumi-agent-kit
  version: "2.0.0"
module: specialized-output
triggers: ["transcribe", "subtitles", "SRT", "audio to text", "video captions"]
---

# Audio Transcribe + Revise

A transcript without correction is a first draft — useful but incomplete.
The craftsman who understands the domain knows when the machine wrote the wrong word.
Context documents are the domain knowledge. Claude is the editor.

**Principles:** YAGNI, KISS | Claude as the revision LLM — no external API | Context-first correction

## When to Use

- Transcribing meeting recordings, demos, lectures, interviews
- Audio/video with domain-specific vocabulary (product names, technical terms, proper nouns)
- Multilingual content (Vietnamese + English + Japanese common in Sun Asterisk context)
- When base transcription quality is acceptable but proper nouns are wrong

## When Not to Use

| Situation | Better Tool |
|-----------|-------------|
| Need real-time captions | Use the Audio Transcribe web interface |
| No API key yet | Create one at Integrations > API Keys — see Setup Check |
| Already have clean SRT, no revision needed | Open the `.srt` in any editor or player |
| Context-free revision (no docs, no hints) | Run with `--no-revise` flag |

## Modes

Parse `$ARGUMENTS` to detect mode:

| Argument pattern | Mode |
|-----------------|------|
| Audio/video file + context docs | Full pipeline: context → transcribe → revise |
| Audio/video file only | Transcribe + lightweight revision (language + common patterns) |
| `--no-revise` | Transcribe only, skip revision |
| SRT file path (no audio) | Revision only — skip transcription |

## Pipeline

Load the appropriate workflow reference:

- Full pipeline → `references/full-pipeline.md`
- Revision only → `references/revision-only.md`

## Argument Parsing

Extract from user message:

| Field | Source | Notes |
|-------|--------|-------|
| `AUDIO_FILE` | Positional arg or file path in message | Required (unless revision-only mode) |
| `CONTEXT_DOCS` | `--context` paths or PDF files mentioned | Optional — PDF, TXT, MD supported |
| `CONTEXT_JSON` | `--context-json` path or `*_context.json` file mentioned | Optional — pre-built Soniox context JSON, overrides `CONTEXT_DOCS` for CLI and revision |
| `LANG_HINTS` | `--language` or language mentioned | Default: `vi,en,ja`. Only shapes the `hints` sentence — the service auto-detects the source language |
| `HINTS` | `--hints "..."` or domain context in message | Optional free text |
| `OUTPUT_SRT` | `--output` | Default: `<audio_stem>.srt` |
| `REVISE` | absence of `--no-revise` | Default: true |

If `AUDIO_FILE` missing and no SRT path detected → ask once via `AskUserQuestion`.

## Mesh Connections

This skill composes with the Takumi mesh:

| Need | Route to |
|------|----------|
| Research domain terminology before revision | `/tkm:research <domain>` |

## Requirements

| Requirement | Notes |
|-------------|-------|
| Python 3.10+ | |
| `ffmpeg` **and** `ffprobe` on `PATH` | **Required for every input, not just video** — `ffprobe` measures duration. Omitting it makes the server guess from file size and overcharge quota by ~8.7x on video. `brew install ffmpeg` / `apt install ffmpeg` |
| `AUDIO_TRANS_API_KEY` | **Required** — create at Integrations > API Keys (see Setup Check) |
| `AUDIO_TRANS_API_URL` | Optional — defaults to `https://audio-transcribe.sun-asterisk.ai/api/v1`. Read **only from a real environment variable, never from `.env`**, and must be `https` |

## Setup Check

Python dependencies (`httpx`, `python-dotenv`) install automatically via the Takumi kit's
`install.sh` (from `scripts/requirements.txt`).

Get an API key — this is self-service, no admin needed:

1. Sign in to `https://audio-transcribe.sun-asterisk.ai` with your company email.
2. Sidebar → **Integrations** → **API Keys** → **Create**.
3. **Copy it immediately** — the key is shown exactly once (the server stores only a SHA-256
   hash). It looks like `sk-` followed by 64 hex characters.
4. Export it, or add it to a `.env` in your working directory:
   ```bash
   export AUDIO_TRANS_API_KEY="sk-..."
   ```

Verify:
```bash
python3 scripts/transcribe_audio_trans.py --help
```

Quota is **600 minutes per user per calendar month** by default, resetting on the 1st. A key has
no expiry; revoke it from the same Integrations > API Keys page (revocation is web-only — the
API will not accept an API key for that route).

## Your Transcribe History

The API key belongs to your own account, so every file you push from the CLI carries your
`user_id` and lands in the same history the web dashboard shows. To read it without leaving the
terminal:

```bash
python3 scripts/history_audio_trans.py                 # 20 most recent + remaining quota
python3 scripts/history_audio_trans.py --limit 50
python3 scripts/history_audio_trans.py --status completed
python3 scripts/history_audio_trans.py --json          # raw payload, when the shape changed
```

Read-only: no quota spent, nothing created. Files **stay on the server by default** so this
history keeps working — `--delete-remote` on a transcribe run opts out for that file.

## If the skill starts behaving oddly

Four of the routes this skill uses are absent from the service's `openapi.json`, so they can
change without notice. Three of them are guarded: `GET /files/{id}` (a missing field aborts in
seconds naming the exact key, instead of mis-reporting it as a stuck queue),
`GET /jobs/{id}/segments` (a payload that is not a bare array aborts rather than writing an
empty SRT that looks like success) and `POST /files/upload-url` (a renamed key aborts before
the upload starts, so no `pending_upload` row is stranded — and a network drop mid-upload
still reports itself rather than surfacing as a `KeyError`). The `GET /files` listing is not
guarded yet. To check the contract directly, without spending quota or creating a file:

```bash
python3 scripts/check_contract.py                 # quota + listing only
python3 scripts/check_contract.py --file-id <id>  # also checks the GET /files/{id} shape
```

Exit 0 = contract intact · 1 = shape changed, tell the skill maintainer · 2 = could not check,
not a contract problem. A revoked key (401/403), a rate limit (429) and a service outage (5xx)
all land on 2 — they say nothing about the shape, so they must not send you off fixing a client
that is not broken.

## Data Handling

Everything that leaves your machine on one run, and how long it lives. Files are **kept on the
server by default** so your transcribe history stays readable. `--delete-remote` opts out, but
know what it buys: `DELETE` is a **soft delete** — it sets `deleted_at`; the API then returns
404, which reads as "gone" but is not. The data stays either way; only your own view of it
changes.

| What | Goes to | Lifetime |
|---|---|---|
| Original media | Service S3 | Removed only once a playback MP4 is built; a job that fails earlier leaves it in place |
| Audio segments | **Soniox** (third-party STT) via a presigned URL | Service deletes its temp copy best-effort; vendor-side retention unknown |
| Transcript | Service database | Survives soft delete; no purge job exists |
| `hints` string | `files.hints` **and** forwarded to Soniox as `context` | Survives soft delete **and** leaves the company |

Audio reaching an STT vendor is inherent to any hosted transcription — it is not something this
skill adds. The one piece the skill controls is `hints`, so **the prose summary auto-extracted
from your context documents is NOT sent by default**. Terms, general facts and anything you type
into `--hints` are sent; the prose stays local and is still used in Phase 3, where Claude revises
the SRT on your machine. Pass `--send-doc-summary` to include it.

Do not put customer recordings or customer documents through this skill without checking the
relevant NDA/DPA first — Soniox is a sub-processor.

## References

- `references/full-pipeline.md` — Context extraction → transcribe → revise workflow
- `references/revision-only.md` — Revision-only workflow for existing SRT files
- `references/templates/soniox-context.json` — Template for Soniox context JSON output
