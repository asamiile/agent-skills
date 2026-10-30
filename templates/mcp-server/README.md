# knowledge-server

Read-only MCP server that lets AI agents search and read {what the content is}. Rename `knowledge_server` / `knowledge-server` everywhere before use.

## Use it

```sh
claude mcp add knowledge-server -- uvx --from knowledge-server knowledge-server
```

From a local checkout: `uv run --project /path/to/repo knowledge-server`.

Example prompt:

```text
Use the knowledge-server MCP as a read-only reference. Search for "{intent}",
read summaries of the top results, then fetch the source of only the best one or two.
```

## Tools

| Tool | Returns |
| --- | --- |
| `search(query, category, limit)` | Manifest entries, never file contents |
| `get_summary(path)` | Metadata and the start of the README next to the file |
| `get_source(path, max_chars)` | One file's text, truncated with a notice above the limit |

The server is read-only: paths are checked against the content folder and file types are allowlisted.

## Develop

```sh
uv sync --group dev
uv run pytest
uv run python scripts/update_manifest.py --write   # after adding content; then refine the drafts
```

`catalog/manifest.json` is the file to edit. `src/knowledge_server/data/manifest.json` is generated from it.
