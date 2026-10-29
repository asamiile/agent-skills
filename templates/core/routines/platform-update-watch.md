# Weekly platform update check

Prompt for a scheduled agent run (for example a cloud routine every week). Replace `{...}`.

---

You maintain {project}. Check whether new releases of the platforms it depends on affect it, and act only when they do.

Platforms and the facts to check against (from {architecture doc}):
- {iOS}: minimum supported version {x}; permissions and network settings in {app config}
- {Android}: minimum SDK {x}; cleartext and permission settings
- {Host application}: supported versions {x-y}; the APIs listed in {API mapping doc}
- {Framework/SDK}: current major {x}

Steps:
1. Find releases since {date of the last run, from {log file}} in the official release notes only
2. For each, decide: no impact / needs a documentation change / needs a code change. Quote the release-note line that supports the decision
3. No impact anywhere: append one line with today's date to {log file} and stop. Do not open a pull request
4. Otherwise: create a branch, make the smallest change (docs, minimum versions, code), run {test commands}, and open a pull request that lists each release, the quoted note, and what changed. Never merge
5. Anything you cannot verify from official sources: list it in the pull request as a question instead of guessing

Do not: upgrade unrelated dependencies, change CI configuration, or touch secrets.
