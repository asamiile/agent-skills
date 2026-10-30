#!/usr/bin/env python3
"""
Check translated Markdown pairs (README.md + README.ja.md, guide.md + guide.ja.md, ...).

  python3 scripts/check_doc_pairs.py [root] [--suffix ja]

For every <name>.md with a <name>.<suffix>.md beside it:
  structure   same sequence of heading levels in both files (translated text may differ, the outline may not)
  links       each file links to the other
  fences      code fences are balanced
  relative    relative links point to existing files, and #anchors to existing headings
Exits 1 when anything is found. Uses only the standard library.
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote

HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)|<a\s[^>]*href=\"([^\"]+)\"")
FENCE = re.compile(r"^\s*(```|~~~)")
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build"}


def outline(text: str) -> tuple[list[tuple[int, str]], bool]:
    """Headings outside code blocks, and whether fences are balanced."""
    headings, fence = [], None
    for line in text.splitlines():
        match = FENCE.match(line)
        if match:
            fence = None if fence == match.group(1) else (fence or match.group(1))
            continue
        if fence is None:
            heading = HEADING.match(line)
            if heading:
                headings.append((len(heading.group(1)), heading.group(2)))
    return headings, fence is None


def slug(title: str) -> str:
    """GitHub-style anchor: lowercase, drop punctuation except - and _, spaces to hyphens."""
    title = re.sub(r"<[^>]+>|`|\*\*?|__?", "", title).strip().lower()
    kept = "".join(c for c in title if c in " -_" or unicodedata.category(c)[0] in "LN")
    return kept.replace(" ", "-")


def anchors(headings: list[tuple[int, str]]) -> set[str]:
    seen: dict[str, int] = {}
    result = set()
    for _, title in headings:
        base = slug(title)
        count = seen.get(base, 0)
        result.add(base if count == 0 else f"{base}-{count}")
        seen[base] = count + 1
    return result


def links(text: str) -> list[str]:
    body = re.sub(r"(```|~~~).*?\1", "", text, flags=re.S)
    return [a or b for a, b in LINK.findall(body)]


def check_links(path: Path, text: str, cache: dict[Path, set[str]]) -> list[str]:
    problems = []
    for target in links(text):
        if re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I) or target.startswith("//"):
            continue  # external or mailto
        file_part, _, fragment = target.partition("#")
        dest = (path.parent / unquote(file_part)).resolve() if file_part else path.resolve()
        if not dest.exists():
            problems.append(f"broken link: {target}")
            continue
        if fragment and dest.suffix == ".md":
            if dest not in cache:
                cache[dest] = anchors(outline(dest.read_text(encoding="utf-8"))[0])
            if unquote(fragment).lower() not in cache[dest]:
                problems.append(f"missing anchor: {target}")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("root", nargs="?", default=".")
    parser.add_argument("--suffix", default="ja")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    findings, pairs, cache = [], 0, {}
    for primary in sorted(root.rglob("*.md")):
        if set(primary.relative_to(root).parts) & SKIP_DIRS or primary.name.endswith(f".{args.suffix}.md"):
            continue
        translated = primary.with_name(f"{primary.stem}.{args.suffix}.md")
        if not translated.exists():
            continue
        pairs += 1
        texts = {p: p.read_text(encoding="utf-8") for p in (primary, translated)}
        (h1, ok1), (h2, ok2) = outline(texts[primary]), outline(texts[translated])
        rel = lambda p: p.relative_to(root).as_posix()  # noqa: E731

        levels1, levels2 = [lvl for lvl, _ in h1], [lvl for lvl, _ in h2]
        if levels1 != levels2:
            first = next((i for i, (a, b) in enumerate(zip(levels1, levels2)) if a != b), min(len(levels1), len(levels2)))
            where = h1[first][1] if first < len(h1) else "(end)"
            findings.append(f"{rel(primary)}: heading structure differs from {translated.name} near '{where}' ({len(h1)} vs {len(h2)} headings)")
        for path, other, ok in ((primary, translated, ok1), (translated, primary, ok2)):
            if not ok:
                findings.append(f"{rel(path)}: unclosed code fence")
            if not any(Path(unquote(t.partition('#')[0])).name == other.name for t in links(texts[path])):
                findings.append(f"{rel(path)}: no link to {other.name}")
            findings += [f"{rel(path)}: {p}" for p in check_links(path, texts[path], cache)]

    for line in findings:
        print(f"✖ {line}")
    print(f"{pairs} pairs checked, {len(findings)} findings")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
