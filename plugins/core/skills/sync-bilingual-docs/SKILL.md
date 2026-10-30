---
name: sync-bilingual-docs
description: Keeps translated Markdown documents in step (README.md and README.ja.md, or any name.md with name.<lang>.md) - takes the file the user edited as the reference, mirrors its structure and content into the other language without restoring removed sections or touching unrelated user edits, keeps reciprocal language links, and checks every pair with a script for matching heading structure, links to each other, balanced code fences, and working relative links and anchors. Use when the user says things like "update the Japanese README too", "sync the translations", "I edited the English version, match the other one", "check the docs for broken links", or "the two READMEs have drifted".
---

# Sync bilingual documents

Starter script, in this repository: `templates/core/scripts/check_doc_pairs.py` (standard library only).

## 1. Pick the reference

The file the user just edited is the reference for both structure and content. If both changed, ask which wins for each conflicting part instead of merging silently.

## 2. Mirror the change

- Same headings in the same order and levels; same lists, tables, code blocks, and links (code, commands, file names, and identifiers stay identical)
- Translate meaning, not word order; keep each language natural
- Links to other documents point to the same language's version when one exists
- Each file links to the other at the top
- Change only what the reference changed. Keep the user's other edits in the target file, and do not bring back sections the reference removed

## 3. Check

```sh
python3 scripts/check_doc_pairs.py            # whole repository; --suffix ja is the default
```

It reports pairs whose heading structure differs, missing links between the pair, unclosed code fences, broken relative links, and anchors that do not exist (computed the way GitHub does, including non-ASCII headings). Run it after every documentation change and in CI.

## 4. Rules for agents

Agent instruction files (`AGENTS.md`, rules, templates) are usually kept in one language only; do not create translated copies of them. Write that down in the project's AGENTS.md together with which documents are bilingual.
