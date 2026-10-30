---
name: build-knowledge-mcp-server
description: Builds a read-only MCP server that lets AI agents search and read a collection of code, docs, or examples - a curated manifest for discovery, a summary step, and bounded source fetches with path checks and size limits - using the official Python SDK (FastMCP), packaged so it runs with uvx, and registered in Claude Code, Codex, VS Code, and Cursor. Use when the user says things like "make my snippets available to agents", "turn this repo into an MCP server", "let Claude search my examples", "build a read-only MCP", or "expose these docs through MCP".
---

# Build a read-only knowledge MCP server

Starter project, in this repository: `templates/mcp-server/` (server, tests, manifest updater, hook, packaging, CI, release). The package is named `knowledge_server`; rename it everywhere (folder, imports, `pyproject.toml`, scripts, hook) first.

## 1. Decide what the server exposes

- The content: which files agents may read, and what one entry is (one example, one doc page, one module)
- The manifest fields that let an agent choose without reading source. Start from `path`, `title`, `category`, `concepts`, `use` (one sentence: when to use it), `good_for`, `complexity`, `dependencies`. Build and maintain it with `mcp-server:maintain-agent-manifest`
- Read-only, always. No tools that write files, run commands, or touch git. If writing is ever needed, make it a separate server

## 2. Shape the tools around a three-step flow

| Step | Tool | Returns |
| --- | --- | --- |
| Discover | `search(query, category, limit)` | Manifest entries only, never file contents |
| Judge | `get_summary(path)` | Metadata plus the first lines of the README next to it |
| Use | `get_source(path, max_chars)` | Text of one file, cut at a limit, with `truncated` and a notice |

Agents pull far less unrelated code into their context when fetching is a separate, deliberate step. Say so in the tool descriptions and in a summary resource. Optional extras that worked: search by mood or intent profile, and recipes that combine several entries by role, resolved through `search` at call time so they never point to stale paths. Details in [references/search-and-ranking.md](references/search-and-ranking.md).

## 3. Guard every read

- Accept only relative paths. Resolve against the content root and reject anything whose resolved path is not inside it (this catches `..`, symlinks, and absolute paths)
- Allow only manifest paths and a short list of file types
- Clamp `max_chars` to a hard maximum and report truncation instead of cutting silently
- Do not expose source files as static resources: resources bypass these checks. Keep resources small (manifest, summary)
- Mark every tool with `ToolAnnotations(readOnlyHint=True, destructiveHint=False, ...)` so clients can treat them as safe
- Raise an error for a refused path; return an empty list (not an error) when a search finds nothing

## 4. Write descriptions for an agent, not a person

Each parameter gets its range, default, and an example. Each tool says what it returns, what it never returns, and which tool to call next. See [references/tool-descriptions.md](references/tool-descriptions.md).

## 5. Package it so it runs anywhere

Resolve the manifest and content from the module's own location, include data files in the wheel, and pin the SDK below its next major version. Then check it from outside the repository: build the wheel, install it into a fresh virtual environment, and call the tools through a real stdio client. See [references/packaging-and-registration.md](references/packaging-and-registration.md).

## 6. Test

`templates/mcp-server/tests/test_server.py` covers: every manifest path exists, a search result can be fetched, no match gives an empty list, summaries contain no source, traversal and absolute paths are rejected, `max_chars` is clamped and reported, and the packaged manifest matches the edited one. Add a test for each new tool's guards.

## 7. Register and document

Register it in the user's clients (commands and config shapes in the reference), and put a short example prompt in the README showing the discover → summarize → fetch order. To publish it, use `mcp-server:publish-python-mcp-server`.
