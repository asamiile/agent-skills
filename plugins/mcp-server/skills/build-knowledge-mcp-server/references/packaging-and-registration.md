# Packaging and registration

## Paths that work after installation

- Locate data from the module: `Path(__file__).resolve().parent / "data" / "manifest.json"`. Never from the working directory: MCP clients start the server from wherever they like
- Anything outside the package (the repository README, a top-level folder) does not exist after `pip install` or `uvx`. Ship what the server needs inside the package, or fall back to a packaged copy
- Include non-Python files in the wheel explicitly (`[tool.hatch.build] include = [...]`). Check the wheel's file list (`unzip -l dist/*.whl`) once, and again whenever the layout changes
- Pin the MCP SDK below its next major (`mcp>=1.0,<2`); the server API can change across majors

## Smoke test from outside the repository

1. `uv build`
2. Install the wheel into a new virtual environment
3. From another directory, start the installed command through a real stdio client (`mcp.client.stdio.stdio_client` + `ClientSession`), list tools and resources, run a search, fetch a file, and try a traversal path

This catches missing data files and working-directory assumptions that unit tests in the checkout cannot.

## Running it

| Situation | Command the client runs |
| --- | --- |
| Published on PyPI | `uvx --from {package-name} {command}` |
| Local checkout | `uv run --project /path/to/repo {command}` |

You normally do not run it by hand; the client starts it. A stdio server that prints anything other than protocol messages to stdout breaks the connection. Log to stderr.

## Registering in clients

Check each client's current documentation; the shapes below change over time.

```sh
claude mcp add {name} -- uvx --from {package-name} {command}      # Claude Code
codex mcp add {name} -- uvx --from {package-name} {command}       # Codex CLI
```

VS Code (`.vscode/mcp.json`) uses a `servers` key with `"type": "stdio"`. Cursor (`.cursor/mcp.json`) and many other clients use `mcpServers` with `command` and `args`.

Cloud-hosted agents (for example a repository's cloud coding agent) run elsewhere: a local stdio server with a path on your machine cannot work there. They need the package installable in their environment, often an explicit list of allowed tools, or an HTTP transport.

## Directories

MCP directories list servers from a public repository; some read a small JSON file at the repository root to identify maintainers. Add it only when you want the listing, and keep the README's install section accurate, since directories show it.
