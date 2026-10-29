---
name: audit-content-quality
description: Audits written content at scale (lessons, docs, help pages, product copy, localized JSON) by splitting the work in two - deterministic checks run by a script in CI (locale parity, empty strings, arithmetic written in the text, banned punctuation) and judgment checks run by an agent against the project's writing rules (style, terminology consistency, things shown but never explained, numbers in questions that do not match what the UI shows, factual accuracy) - reporting findings as a list for the user to choose from instead of fixing them. Use when the user says things like "audit the lessons", "check all the content for problems", "are the English and Japanese files in sync", "review the copy before release", or "find inconsistencies across pages".
---

# Audit content quality

Starter script, in this repository: `templates/core/scripts/check-copy.mjs`. Single-sentence fixes use `core:proofread-copy`.

## 1. Sort the checks

| Kind | Examples | Run by |
| --- | --- | --- |
| Deterministic | Same keys and array lengths in every locale, no empty strings, `A + B = C` actually true, banned punctuation, number formats the UI should never show (raw exponent notation) | A script, in CI |
| Judgment | Writing-rule violations, the same concept named two ways in one unit, a control or metric shown in the UI but never explained, a question whose numbers do not match what the UI shows after the stated steps, wrong facts | An agent, on demand |

Do not ask an agent to do what a script can do; do not put judgment checks in CI, where cost and false positives make them noise.

## 2. Run the script first

```sh
node scripts/check-copy.mjs content/en.json content/ja.json        # add --no-colons if the style forbids colons
```

Extend it with project-specific deterministic checks (grep-level rules on components, for example). Its output is input for step 3, so the agent does not repeat it.

## 3. Judgment review

For each unit (one lesson, page, or article):

1. Read the content **and** the code that renders it together. Many problems only show when both are read: what the UI displays, its initial state, how controls change values
2. Apply the project's writing rules one by one (see `core:proofread-copy` and its reference)
3. Check that every element the UI shows is introduced in the text, and every noun in the goal or title is covered
4. When a question uses concrete numbers, trace the initial state and the stated steps through the code and confirm the UI would show those numbers
5. Check facts. Note anything that looks like a new rule worth adding

For many units, give each unit to its own subagent and merge their findings; the main conversation stays small.

## 4. Report, do not fix

Report every finding as a list (file, location, category, what is wrong, suggested change), using the host's findings tool when there is one. The user picks what to fix. Propose new writing rules separately; add them to the rules file only after the user agrees.
