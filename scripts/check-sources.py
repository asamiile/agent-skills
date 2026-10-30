#!/usr/bin/env python3
"""
Find new commits in the repositories knowledge is imported from.

  scripts/check-sources.py                 fetch every source and report commits after its imported_commit
  scripts/check-sources.py --json          the same, as JSON (for the scheduled check)
  scripts/check-sources.py mark ID [SHA]   record SHA (default: the branch head) as imported for source ID

The list lives in .import-sources.json (gitignored; copy .import-sources.example.json). It names the sources,
so it never leaves this machine, and nothing here writes source names into tracked files.
Sources are only fetched and read: local clones get `git fetch`, never a checkout or reset.
Uses only the standard library and git.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIST = Path(os.environ.get("IMPORT_SOURCES_FILE", ROOT / ".import-sources.json"))  # override for tests
MAX_LOG = 50  # commits listed per source; the stat summary still covers the whole range


def git(repo: Path, *args: str, check: bool = True) -> str:
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    if check and result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout.strip()


def is_ancestor(repo: Path, older: str, newer: str) -> bool:
    """False when `older` is unknown or no longer in the branch's history (force-push, rebase)."""
    return subprocess.run(["git", "-C", str(repo), "merge-base", "--is-ancestor", older, newer], capture_output=True).returncode == 0


def load() -> dict:
    if not LIST.exists():
        sys.exit(f"{LIST.name} not found. Copy .import-sources.example.json to {LIST.name} and fill it in.")
    data = json.loads(LIST.read_text(encoding="utf-8"))
    ids = [s.get("id") for s in data.get("sources", [])]
    if len(ids) != len(set(ids)) or not all(ids):
        sys.exit("Every source needs a unique id.")
    return data


def save(data: dict) -> None:
    LIST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def repo_for(source: dict, clone_root: Path) -> Path:
    """Local path of the source; URL sources are cloned once into clone_root/<id>."""
    if source.get("path"):
        return Path(source["path"]).expanduser()
    target = clone_root / source["id"]
    if not (target / ".git").exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "--quiet", "--filter=blob:limit=1m", source["url"], str(target)], check=True)
    return target


def head_ref(repo: Path, branch: str) -> str:
    """The branch to compare against: the remote-tracking branch when there is a remote, else the local branch."""
    if git(repo, "remote", check=False):
        git(repo, "fetch", "--quiet", "origin", branch)
        return f"origin/{branch}"
    return branch


def check(data: dict) -> list[dict]:
    clone_root = Path(data.get("clone_root", "~/.cache/agent-skills/sources")).expanduser()
    results = []
    for source in data["sources"]:
        result = {"id": source["id"], "status": "", "commits": [], "stat": "", "head": None}
        try:
            repo = repo_for(source, clone_root)
            ref = head_ref(repo, source.get("branch", "main"))
            head = git(repo, "rev-parse", ref)
            result["head"] = head
            since = source.get("imported_commit")
            if not since:
                result["status"] = "no baseline (run: mark ID after the first import)"
            elif since == head:
                result["status"] = "no change"
            elif not is_ancestor(repo, since, head):
                result["status"] = "history rewritten since the last import; review the whole repository"
            else:
                log = git(repo, "log", "--no-merges", "--format=%h %ad %s", "--date=short", f"{since}..{head}")
                result["commits"] = log.splitlines()[:MAX_LOG]
                summary = git(repo, "diff", "--shortstat", f"{since}..{head}")
                result["stat"] = summary
                count = len(log.splitlines())
                result["status"] = f"{count} new commit{'s' if count != 1 else ''}" if log else "only merge commits"
        except (RuntimeError, subprocess.CalledProcessError, OSError) as error:
            result["status"] = f"error: {error}"
        results.append(result)
    return results


def mark(data: dict, source_id: str, sha: str | None) -> None:
    source = next((s for s in data["sources"] if s["id"] == source_id), None)
    if source is None:
        sys.exit(f"unknown source id: {source_id}")
    clone_root = Path(data.get("clone_root", "~/.cache/agent-skills/sources")).expanduser()
    repo = repo_for(source, clone_root)
    resolved = git(repo, "rev-parse", "--verify", f"{sha}^{{commit}}") if sha else git(repo, "rev-parse", head_ref(repo, source.get("branch", "main")))
    source["imported_commit"] = resolved
    save(data)
    print(f"{source_id}: imported_commit = {resolved[:12]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", nargs="?", default="check", choices=["check", "mark"])
    parser.add_argument("id", nargs="?")
    parser.add_argument("sha", nargs="?")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    data = load()

    if args.command == "mark":
        if not args.id:
            parser.error("mark needs a source id")
        mark(data, args.id, args.sha)
        return 0

    results = check(data)
    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        for r in results:
            print(f"{r['id']}: {r['status']}")
            for line in r["commits"]:
                print(f"    {line}")
            if r["stat"]:
                print(f"    {r['stat']}")
    return 1 if any(r["status"].startswith("error") for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
