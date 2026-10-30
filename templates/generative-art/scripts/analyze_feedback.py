"""
Summarize the user's feedback on artworks (Python standard library only)

  python3 scripts/analyze_feedback.py [FEEDBACK.md]

Expects one entry per work:

  ## {work_name}

  - **Rating**: OK | NG | (blank)
  - **Comment**: free text

Prints rating counts, words that appear in OK and NG comments, and the works whose comments
still wait for action, in the priority order used for polishing.
Edit STYLE_WORDS and COLOR_WORDS to match the vocabulary the user actually writes.
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

STYLE_WORDS = [
    "abstract", "realistic", "dense", "sparse", "dark", "bright", "organic", "geometric",
    "complex", "simple", "blurry", "sharp", "slow", "fast", "calm", "busy", "neon", "minimal",
]
COLOR_WORDS = [
    "black", "white", "gold", "silver", "blue", "navy", "cyan", "teal", "green", "mint",
    "red", "crimson", "orange", "amber", "pink", "magenta", "violet", "purple",
]

ENTRY = re.compile(r"^## +(.+?)\s*$", re.MULTILINE)
# [ \t] rather than \s: a blank field must not swallow the next line
FIELD = re.compile(r"^[ \t]*-[ \t]*\*\*(Rating|Comment)\*\*[ \t]*:[ \t]*(.*)$", re.MULTILINE)


def parse(text: str) -> list[dict[str, str]]:
    heads = list(ENTRY.finditer(text))
    entries = []
    for i, head in enumerate(heads):
        body = text[head.end(): heads[i + 1].start() if i + 1 < len(heads) else len(text)]
        fields = {k.lower(): v.strip() for k, v in FIELD.findall(body)}
        entries.append({"name": head[1], "rating": normalize(fields.get("rating", "")), "comment": fields.get("comment", "")})
    return entries


def normalize(rating: str) -> str:
    """People write "OK.", "ok", "Preview is OK", "NG", "No": reduce to OK, NG, or blank"""
    text = rating.upper()
    if re.search(r"\b(NG|NO|BAD)\b", text):
        return "NG"
    if re.search(r"\bOK\b", text):
        return "OK"
    return ""


def words(comment: str, vocabulary: list[str]) -> list[str]:
    lower = comment.lower()
    return [w for w in vocabulary if re.search(rf"\b{re.escape(w)}\b", lower)]


def priority(entry: dict[str, str]) -> int | None:
    if not entry["comment"]:
        return None
    if entry["rating"] == "NG":
        return 1
    if not entry["rating"]:
        return 2
    return 3  # OK with a comment: expand or tweak


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "FEEDBACK.md")
    if not path.exists():
        print(f"Not found: {path}")
        return 1
    entries = parse(path.read_text(encoding="utf-8"))
    ratings = Counter(e["rating"] or "unrated" for e in entries)
    print(f"Works: {len(entries)}  " + "  ".join(f"{k}: {v}" for k, v in sorted(ratings.items())))

    for label in ("OK", "NG"):
        rated = [e for e in entries if e["rating"] == label]
        style = Counter(w for e in rated for w in words(e["comment"], STYLE_WORDS))
        color = Counter(w for e in rated for w in words(e["comment"], COLOR_WORDS))
        print(f"\n{label} comments")
        print("  style: " + (", ".join(f"{w} ({n})" for w, n in style.most_common(8)) or "-"))
        print("  color: " + (", ".join(f"{w} ({n})" for w, n in color.most_common(8)) or "-"))

    # The file lists newest works first, so the order within a priority keeps that
    waiting = sorted((p, i, e) for i, e in enumerate(entries) if (p := priority(e)) is not None)
    print("\nWaiting for action (priority, work, comment)")
    for p, _, e in waiting[:15]:
        print(f"  {p}  {e['name']}: {e['comment'][:100]}")
    if not waiting:
        print("  none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
