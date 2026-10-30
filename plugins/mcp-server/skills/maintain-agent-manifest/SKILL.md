---
name: maintain-agent-manifest
description: Keeps an agent-facing manifest (a JSON catalog that tells AI agents what each file or example is for, so they can choose without reading source) complete and accurate - drafts entries for new files from the code and README, records files left out on purpose, refines drafts into useful descriptions, keeps one source of truth with a generated packaged copy, and checks it in CI and through a Claude Code hook. Use when the user says things like "update the manifest", "I added a new example, register it", "the MCP search can't find my new file", "the catalog is out of date", or "auto-update the index when files change".
---

# Maintain an agent-facing manifest

Starter files, in this repository: `templates/mcp-server/scripts/update_manifest.py`, `templates/mcp-server/catalog/`, `templates/mcp-server/.claude/hooks/update-manifest.sh`, and `.claude/settings.json`.

## 1. What an entry is for

An entry lets an agent decide whether a file is worth reading. Write it for that decision:

| Field | Content |
| --- | --- |
| `path` | Relative path from the content root |
| `title` | Short human name (the README's first heading) |
| `category` | Top-level folder |
| `concepts` | Searchable technique words (3-6), the words a user would type |
| `use` | One sentence: when to use it, in terms of the result rather than the implementation |
| `good_for` | Short tags for intent or composition |
| `complexity` | `low` / `medium` / `high` |
| `dependencies` | Direct third-party libraries |

## 2. One source of truth

Edit one file (`catalog/manifest.json`). When the package needs its own copy, the script writes it; nobody edits the copy. Two hand-maintained copies drift silently: the server keeps serving the old one while the edited one looks correct. A test compares the two.

## 3. Add new files

```sh
python scripts/update_manifest.py           # lists missing files, broken paths, drafts, a stale copy; exit 1 if any
python scripts/update_manifest.py --write   # appends drafts and refreshes the packaged copy
```

The script never changes existing entries. A draft takes the README heading as title, imports (parsed with `ast`, never executed) as dependencies, line count as complexity, and per-category defaults. It is marked `"draft": true`, and the check fails while any draft remains.

## 4. Refine every draft

Generated text is generic; refine it before finishing:

1. Read the file and its README
2. Replace `concepts` with the technique words a user would search for, `use` with one concrete sentence, and `good_for` with intent tags
3. Correct `complexity` if line count misleads (short but mathematically dense, or long but simple)
4. Remove `draft`, run `--write`, and confirm a search for the obvious words returns the entry

## 5. Leave files out on purpose

Helpers, experiments, and duplicates go into `catalog/baseline.json` (`{"paths": [...]}`). Remove a path from the baseline only when adding a polished entry for it.

## 6. Automate the reminder

- **CI**: run the check without `--write`. It fails on missing entries, entries pointing to deleted files, drafts, and a stale packaged copy
- **Claude Code hook**: a `PostToolUse` hook on `Write|Edit` runs `--write` when a content file changes and returns `additionalContext` asking Claude to refine the new draft. The hook reads the path from `tool_input.file_path` in the JSON on stdin; a hook that reads a top-level `file_path` never fires and fails silently. Check the hooks documentation for the current input format, and test the hook by piping a sample JSON into it
