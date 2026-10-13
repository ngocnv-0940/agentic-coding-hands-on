# Troubleshooting

Referenced from `SKILL.md`. Symptom on the left, the fix on the right.

| Issue | Solution |
|-------|----------|
| Download/upload fails with 403 or proxy error | **Never use WebFetch for presigned S3 URLs** — always use Bash tool to call `clio-api.py download` or `clio-api.py put`. WebFetch goes through a proxy that blocks `linodeobjects.com` and can't handle long presigned URLs |
| `clio_query` not found | MCP server not configured — check Setup |
| `clio_get_assets_download_url` not found | MCP server not configured — check Setup |
| `clio_get_assets_upload_url` not found | MCP server not configured — check Setup |
| `statusCode: 401` from MCP tool | `x-api-key` header missing or invalid — check MCP server config |
| `statusCode: 403` on finalize | Role lower than Editor, or API key is out of project scope |
| `statusCode: 400` on finalize | Wrong `storage_path` or `asset_type` mismatch — use exactly what `clio_get_assets_upload_url` returned |
| `clio-api.py put` HTTP error | Presigned URL expired — re-call `clio_get_assets_upload_url` to get a fresh URL |
| `download_url` expired | Presigned URLs are time-limited — re-call `clio_get_assets_download_url` to get a fresh URL |
| No `.clio.yml` | Create in project root with `project_id` |
| Mermaid PNG fails | Install Node.js and `@mermaid-js/mermaid-cli` |
| `Template not found` | Verify `SVN Proposal Menu.pptx` in `.claude/skills/bidding-proposal/templates/` |
| gen-slide skips slides | Missing profile sections produce empty/cleared shapes — check JSON in Step A |
| Slide 1 still says `SVN Proposal Menu` / `○○株式会社　御中` / `2025.04.04` | The document's addressee or date notation wasn't read (gen-slide warns on its last line). Re-run with `--cover-company "..."` / `--cover-date "..."`. Never edit a supplied document to fix this. The `○○株式会社　御中` line is fixed template wording and is never filled — see `cover-and-agenda.md`. |
| `requests` not installed | Run `pip install -r .claude/skills/bidding-proposal/scripts/requirements.txt` |
| `No module named 'pptx'` / `No module named pip` / `No module named ensurepip` (Claude Desktop sandbox) | gen-slide.py **self-bootstraps** deps via `scripts/ensure_deps.py` into a writable temp dir — and when the sandbox python ships without pip **and** ensurepip, it auto-downloads `get-pip.py` into that dir first. Just run `python3 gen-slide.py …`. **Do NOT** bootstrap pip manually across separate bash calls (sandbox `/tmp` is wiped between calls) — the script does it all in one process. Override install dir with `CLIO_PKG_DIR` if needed. |

---

