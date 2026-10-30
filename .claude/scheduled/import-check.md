# Weekly import check

Prompt for the Claude Desktop local scheduled task that looks for new knowledge in the source repositories.
Paste everything below the line into the task's instructions. Setup and requirements: README.md, "Automatic import checks".

---

Check whether the repositories listed in `.import-sources.json` have new commits since knowledge was last imported, and prepare a report. Do not import anything and do not change tracked files.

1. Run `scripts/check-sources.py --json`.
2. Read `.import-reports/last-run.txt` if it exists (the date of the previous check), then write today's date into it.
3. If every source is "no change": stop without a report or notification.
4. For each source with new commits, read only what changed in that commit range (`git -C <repo> diff <imported_commit>..<head>` and the touched files). Read the sources; never modify them. Then compare against the existing plugins, skills, and templates in this repository.
5. Write `.import-reports/YYYY-MM-DD.md` (gitignored) with, per source:
   - the commit range and a one-line summary of what changed
   - candidates in the table format of `.claude/skills/import-knowledge/SKILL.md` step 2, marked "new" or "update to {existing skill}"
   - new banned-term candidates: names in the changed files that are not yet in `.confidential-terms`
   - "nothing to import" when the changes are project-specific only
   Sources with an error or "history rewritten" get one line saying so.
6. Send a push notification to my phone: the number of sources with candidates, the report path, and the previous check date. For example: "Import check: 3 candidates in 2 sources. Report: .import-reports/2026-11-02.md (previous check 2026-10-26)."

Rules:
- Never write source repository names, URLs, or banned terms anywhere except `.import-reports/` and the notification.
- Never commit, push, create branches, or edit `.confidential-terms`, `.import-sources.json`, skills, or templates. `scripts/check-sources.py mark` is run only during an actual import.
- If a step needs a permission you do not have, stop and say which one.
