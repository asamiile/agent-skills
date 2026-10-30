"""
Read-only knowledge MCP server (stdio) built with the official Python SDK's FastMCP.

Agents discover entries in a curated manifest, read a short summary, and fetch source text only for
the entries they choose. Nothing here writes files, runs commands, or touches git.

Layout inside the package (works the same from a checkout and from a pip/uvx install):
  knowledge_server/server.py            this file
  knowledge_server/data/manifest.json   curated manifest (generated copy; see scripts/update_manifest.py)
  knowledge_server/content/...          the files the manifest points to
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any

from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from pydantic import Field

SERVER_NAME = "knowledge-server"  # rename with the package
DEFAULT_MAX_CHARS = 12_000
ABSOLUTE_MAX_CHARS = 20_000
SUMMARY_LINES = 6
READABLE_SUFFIXES = {".py", ".md"}  # file types get_source may return besides manifest paths

# Resolve everything from this file, never from the working directory, so an installed package works
PACKAGE_DIR = Path(__file__).resolve().parent
CONTENT_ROOT = PACKAGE_DIR / "content"
MANIFEST_PATH = PACKAGE_DIR / "data" / "manifest.json"

# Words that should also match related terms; keep it small and specific to the content
SYNONYMS: dict[str, list[str]] = {
    # "flow": ["fluid", "stream", "vector field"],
}

READ_ONLY = ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False)

mcp = FastMCP(SERVER_NAME)


class AccessError(ValueError):
    """The requested path is not allowed or does not exist."""


@lru_cache(maxsize=1)
def load_manifest() -> dict[str, Any]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(manifest.get("entries"), list):
        raise TypeError("The manifest must contain an 'entries' array")
    return manifest


def entries() -> list[dict[str, Any]]:
    return load_manifest()["entries"]


@lru_cache(maxsize=1)
def entries_by_path() -> dict[str, dict[str, Any]]:
    return {e["path"]: e for e in entries() if isinstance(e.get("path"), str)}


def resolve_path(path: str) -> tuple[Path, str]:
    """Resolve a content-relative path and refuse anything that leaves CONTENT_ROOT."""
    if not path or Path(path).is_absolute():
        raise AccessError("Use a relative path from the manifest")
    resolved = (CONTENT_ROOT / path).resolve()
    try:
        relative = resolved.relative_to(CONTENT_ROOT).as_posix()
    except ValueError as exc:
        raise AccessError("Paths outside the content folder are not allowed") from exc
    if relative not in entries_by_path() and resolved.suffix not in READABLE_SUFFIXES:
        raise AccessError(f"Only manifest paths and {', '.join(sorted(READABLE_SUFFIXES))} files can be read")
    if not resolved.is_file():
        raise AccessError("No such file")
    return resolved, relative


def search_text(entry: dict[str, Any]) -> str:
    parts = [str(entry.get(k, "")) for k in ("title", "category", "use")]
    for key in ("concepts", "good_for"):
        parts.extend(str(v) for v in entry.get(key, []))
    return " ".join(parts).lower()


def score(entry: dict[str, Any], query: str) -> int:
    """Phrase match > concept > category > any field. Tune the weights against real queries."""
    query = query.lower().strip()
    if not query:
        return 1
    tokens = set(query.split())
    for token in list(tokens):
        tokens.update(s.lower() for s in SYNONYMS.get(token, []))
    text = search_text(entry)
    concepts = {str(c).lower() for c in entry.get("concepts", [])}
    category = str(entry.get("category", "")).lower()
    total = 8 if query in text else 0
    for token in tokens:
        total += (2 if token in text else 0) + (4 if token in concepts else 0) + (3 if token == category else 0)
    return total


def summary_of_manifest() -> dict[str, Any]:
    counts: dict[str, int] = {}
    for entry in entries():
        category = str(entry.get("category", "uncategorized"))
        counts[category] = counts.get(category, 0) + 1
    return {
        "name": SERVER_NAME,
        "entry_count": len(entries()),
        "categories": dict(sorted(counts.items())),
        "recommended_flow": ["search to discover", "get_summary to judge candidates", "get_source only for chosen paths"],
    }


# ---- Resources: small, static views. Source files are deliberately not resources, so every read goes
# ---- through the path checks and size limit of get_source.


@mcp.resource(f"resource://{SERVER_NAME}/manifest-summary", name="manifest_summary", mime_type="application/json",
              description="Entry count, categories, and the recommended tool order.")
def manifest_summary_resource() -> dict[str, Any]:
    return summary_of_manifest()


@mcp.resource(f"resource://{SERVER_NAME}/manifest", name="manifest", mime_type="application/json",
              description="The full curated manifest.")
def manifest_resource() -> dict[str, Any]:
    return load_manifest()


# ---- Tools


@mcp.tool(annotations=READ_ONLY)
def search(
    query: Annotated[str, Field(description="Short descriptive words matched against title, category, concepts, use, and good_for, e.g. 'recursive branching'. Related words are added automatically.")],
    category: Annotated[str | None, Field(description="Exact category (case-insensitive). Omit to search everything. See the manifest-summary resource for the list.")] = None,
    limit: Annotated[int, Field(description="Maximum results, 1-50. Default 5. Sorted by relevance.")] = 5,
) -> list[dict[str, Any]]:
    """Find manifest entries by keyword, category, or intended use.

    Returns manifest metadata only, never file contents. An empty list means nothing matched; it is not an error.
    Next step: get_summary for promising paths, then get_source only for the ones you will use.
    """
    wanted = category.lower().strip() if category else None
    ranked = []
    for entry in entries():
        if wanted and str(entry.get("category", "")).lower() != wanted:
            continue
        s = score(entry, query)
        if s > 0:
            ranked.append((s, entry))
    ranked.sort(key=lambda item: (-item[0], item[1].get("path", "")))
    return [entry for _, entry in ranked[: max(1, min(int(limit), 50))]]


@mcp.tool(annotations=READ_ONLY)
def get_summary(
    path: Annotated[str, Field(description="Relative path from search results, e.g. 'category/name/name.py'.")],
) -> dict[str, Any]:
    """Return an entry's metadata and the first lines of the README next to it, without source code.

    Cheaper than get_source; use it to decide whether an entry is worth fetching.
    """
    resolved, relative = resolve_path(path)
    readme = resolved if resolved.name == "README.md" else resolved.parent / "README.md"
    excerpt = None
    if readme.is_file():
        lines = [line.strip() for line in readme.read_text(encoding="utf-8", errors="replace").splitlines()
                 if line.strip() and not line.strip().startswith("```")]
        excerpt = "\n".join(lines[:SUMMARY_LINES])[:1200] or None
    entry = entries_by_path().get(relative, {"path": relative, "title": resolved.parent.name.replace("_", " ").title()})
    return {**entry, "readme_excerpt": excerpt}


@mcp.tool(annotations=READ_ONLY)
def get_source(
    path: Annotated[str, Field(description="Relative path from search results. Absolute paths and paths that leave the content folder are rejected.")],
    max_chars: Annotated[int, Field(description=f"Characters to return, 1-{ABSOLUTE_MAX_CHARS}. Default {DEFAULT_MAX_CHARS}. Longer files come back truncated with a notice.")] = DEFAULT_MAX_CHARS,
) -> dict[str, Any]:
    """Return the text of one file listed in the manifest (or a readable file next to it).

    Returns path, content, truncated, and notice (null unless truncated). Fetch only what you will use.
    """
    resolved, relative = resolve_path(path)
    limit = max(1, min(int(max_chars), ABSOLUTE_MAX_CHARS))
    text = resolved.read_text(encoding="utf-8", errors="replace")
    truncated = len(text) > limit
    return {
        "path": relative,
        "content": text[:limit],
        "truncated": truncated,
        "notice": f"Truncated to {limit} characters; max_chars can go up to {ABSOLUTE_MAX_CHARS}." if truncated else None,
    }


def main() -> None:
    mcp.run()  # stdio


if __name__ == "__main__":
    main()
