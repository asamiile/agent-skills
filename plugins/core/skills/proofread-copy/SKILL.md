---
name: proofread-copy
description: Proofreads and rewords a sentence or passage the user quotes from a site's content - locates the exact file and key (never guesses), applies the project's writing rules, fixes the same term everywhere else in the same unit, mirrors the fix in other locales only when the same problem exists there, validates the files, and records any new recurring pattern as a rule. Use when the user quotes text and says things like "this sentence is unclear", "reword this", "fix the Japanese here", "this explanation is hard to follow", or "make this consistent".
---

# Proofread quoted copy

Writing rules that have worked for technical explanations: [references/writing-rules.md](references/writing-rules.md). Projects keep their own rules file; read it first.

## Steps

1. **Find the exact location.** Search for part of the quote (`grep -rn "{fragment}" content/`). Identify the file, the key, and the unit (lesson, page) it belongs to. If it appears in several places, use the page the user was looking at to decide. Do not edit from memory
2. **Check the rules.** Decide whether the problem is an existing rule (missing result in a condition, contrast word without its counterpart, vague cause, colon, term defined only in parentheses, and so on) or something new
3. **Look for the same term in the same unit**: headings, introduction, steps, questions, explanations, hints, and labels in the UI code. Fix them together, or the unit ends up using two names for one thing
4. **Write the change.** Fix clear problems (grammar, ambiguity, redundancy) directly. For matters of taste (tone, word choice), show options first
5. **Other locales.** Apply the same fix in other languages only when the same problem exists there. If the user quoted one language, do not rewrite the others beyond that
6. **Edit and validate.** Edit with exact string replacement (quotes and escapes in JSON break easily), then parse every edited file (`node -e "JSON.parse(require('fs').readFileSync('{file}'))"`), and run the type check if the content is typed
7. **Reply briefly** with the new text quoted. No long explanation
8. **Record new patterns.** When the fix revealed a pattern likely to recur, propose a one-line rule for the project's rules file: wording rules with the writing rules, UI causes (slider steps, labels, panel layout) with the known pitfalls
