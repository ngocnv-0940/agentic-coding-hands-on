---
name: tkm:artifact
description: "Manage Takumi Artifacts via the `tkm artifact` CLI — share files or folders as a link, and any other artifact request. Use when the user mentions an artifact ('tạo artifact', 'share HTML này', 'publish artifact', 'upload file này lên'), or wants a shareable link for generated HTML output."
keywords: [artifact, upload, share, html, url, publish, link, download, comments]
argument-hint: "<action> [args] — see `tkm artifact --help`"
metadata:
  author: takumi-agent-kit
  version: "1.3.0"
module: specialized-output
triggers: ["artifact", "tạo artifact", "share HTML", "publish artifact", "upload artifact", "shareable link"]
---
# Takumi Artifact

Fulfil the user's artifact request with the `tkm artifact` CLI — pick the sub-command that matches the request (upload, list, search, download, delete, open, comments, …).

The CLI is the source of truth. When unsure of an action or its options, check:

```bash
tkm artifact --help            # available actions
tkm artifact <action> --help   # options + examples for that action
```

- Relay the CLI output (URLs, tables, errors) to the user. On an unknown flag/action, re-check `--help` instead of guessing.
- Not logged in → tell the user to run `tkm auth login`.
- After creating a new artifact, open it in the browser for the user.
- Artifacts are **private by default** — after an upload, tell the user they can change visibility (Public, or share with Sun\* members by email) via the **Share** menu on the web.

## Handle errors

| Error                     | Action                                                      |
| ------------------------- | ----------------------------------------------------------- |
| Not logged in             | Tell user to run `tkm auth login` first                     |
| File not found            | Show the resolved path, ask user to check                   |
| File over 20 MB           | Name the offending file, suggest compressing or removing it |
| Unsupported extension     | Suggest removing                                            |
| Upload failed (API error) | Surface the error message from the CLI, suggest retry       |
