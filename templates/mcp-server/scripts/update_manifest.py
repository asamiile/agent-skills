#!/usr/bin/env python3
"""
Keep the agent-facing manifest in step with the content folder.

  python scripts/update_manifest.py           # report missing entries and drift; exit 1 if any
  python scripts/update_manifest.py --write   # append draft entries, then copy the manifest into the package

- catalog/manifest.json is the source of truth (people and agents edit it). The package ships a copy in
  src/<package>/data/manifest.json; this script writes that copy, so never edit it by hand
- Existing entries are never changed. New files get a conservative draft that an agent or a person refines
- catalog/baseline.json lists files left out on purpose; they are never reported as missing
"""

from __future__ import annotations

import argparse
import ast
import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONTENT_ROOT = ROOT / "src" / "knowledge_server" / "content"
MANIFEST = ROOT / "catalog" / "manifest.json"
BASELINE = ROOT / "catalog" / "baseline.json"
PACKAGED = ROOT / "src" / "knowledge_server" / "data" / "manifest.json"

SUFFIXES = {".py"}  # files that become entries
SKIP_NAMES = {"__init__.py"}
# Imports worth listing as dependencies (others are standard library or internal)
KNOWN_DEPENDENCIES: set[str] = {"numpy"}
# Words in a path that suggest concepts, e.g. {"flock": ["flocking", "agents"]}
KEYWORD_CONCEPTS: dict[str, list[str]] = {}
# Defaults per category (the first folder under CONTENT_ROOT)
CATEGORY_USE: dict[str, str] = {}
CATEGORY_GOOD_FOR: dict[str, list[str]] = {}
COMPLEXITY_LINES = (120, 260)  # above the first: medium, above the second: high


def title_for(path: Path) -> str:
    readme = path.parent / "README.md"
    if readme.is_file():
        for line in readme.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("# "):
                return line[2:].strip()
    return path.stem.replace("_", " ").title()


def dependencies_for(path: Path) -> list[str]:
    try:
        tree = ast.parse(path.read_text(encoding="utf-8", errors="replace"))
    except SyntaxError:
        return []
    found = set()
    for node in ast.walk(tree):
        names = [a.name for a in node.names] if isinstance(node, ast.Import) else [node.module] if isinstance(node, ast.ImportFrom) and node.module else []
        found.update(n.split(".")[0] for n in names if n.split(".")[0] in KNOWN_DEPENDENCIES)
    return sorted(found)


def draft_entry(path: Path) -> dict[str, Any]:
    relative = path.relative_to(CONTENT_ROOT).as_posix()
    category = relative.split("/", 1)[0] if "/" in relative else "uncategorized"
    concepts: list[str] = []
    for keyword, values in KEYWORD_CONCEPTS.items():
        if keyword in relative.lower():
            concepts += [v for v in values if v not in concepts]
    lines = path.read_text(encoding="utf-8", errors="replace").count("\n") + 1
    return {
        "path": relative,
        "title": title_for(path),
        "category": category,
        "concepts": concepts[:6],
        "use": CATEGORY_USE.get(category, "DRAFT: describe when to use this"),
        "good_for": CATEGORY_GOOD_FOR.get(category, []),
        "complexity": "high" if lines > COMPLEXITY_LINES[1] else "medium" if lines > COMPLEXITY_LINES[0] else "low",
        "dependencies": dependencies_for(path),
        "draft": True,  # remove after the entry has been reviewed
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--write", action="store_true", help="append drafts and refresh the packaged copy")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {"schema_version": 1, "entries": []}
    known = {e["path"] for e in manifest["entries"]}
    skipped = set(json.loads(BASELINE.read_text(encoding="utf-8")).get("paths", [])) if BASELINE.exists() else set()

    files = sorted(p for p in CONTENT_ROOT.rglob("*") if p.suffix in SUFFIXES and p.name not in SKIP_NAMES)
    missing = [p for p in files if p.relative_to(CONTENT_ROOT).as_posix() not in known | skipped]
    gone = sorted(path for path in known if not (CONTENT_ROOT / path).is_file())
    drafts = sorted(e["path"] for e in manifest["entries"] if e.get("draft"))
    stale_copy = not PACKAGED.exists() or (MANIFEST.exists() and PACKAGED.read_bytes() != MANIFEST.read_bytes())

    for p in missing:
        print(f"missing: {p.relative_to(CONTENT_ROOT).as_posix()}")
    for path in gone:
        print(f"points to a missing file: {path}")
    for path in drafts:
        print(f"draft, needs review: {path}")
    if stale_copy and not missing:
        print(f"packaged copy differs: {PACKAGED.relative_to(ROOT)}")

    if not args.write:
        if missing or gone or stale_copy or drafts:
            print("Run with --write to append drafts and refresh the packaged copy.")
            return 1
        print("Manifest is up to date")
        return 0

    manifest["entries"] += [draft_entry(p) for p in missing]
    manifest["entries"].sort(key=lambda e: (e.get("category", ""), e["path"]))
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    PACKAGED.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(MANIFEST, PACKAGED)
    print(f"Added {len(missing)} draft entries; copied to {PACKAGED.relative_to(ROOT)}")
    return 1 if gone else 0


if __name__ == "__main__":
    raise SystemExit(main())
