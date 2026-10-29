---
name: polish-artwork-from-feedback
description: Refines an existing generative artwork based on the user's ratings and comments - picks the work that most needs it, analyzes trends across all feedback, turns the comment into a few concrete code changes, and saves the result as a new version next to the original. Use when the user says things like "polish one of my works", "apply my feedback", "improve the piece I rated NG", "make a v2 of this sketch", or "what does my feedback say I like".
---

# Polish an artwork from feedback

Works with the catalog and feedback files described in `generative-art:autonomous-artwork-loop`. Starter script, in this repository: `templates/generative-art/scripts/analyze_feedback.py` (Python standard library only).

## 1. Read the trends

Run `python3 scripts/analyze_feedback.py FEEDBACK.md`. It counts style and color words in OK and NG comments and lists works with comments waiting for action. Summarize the user's preferences in a few lines ("prefers dark backgrounds", "dislikes rigid geometry"). Check whether recent OK works share traits that older ones lack, since taste shifts over time.

## 2. Pick the target

| Priority | Entry |
| --- | --- |
| 1 | Rating NG with a comment (a clear rejection to fix) |
| 2 | No rating yet, but a comment |
| 3 | Rating OK with a comment asking for more of something |
| 4 | Rating OK with a minor tweak |

Read the target's entry in `WORKS.md` and its code to understand the core technique.

## 3. Plan three to five directives

Combine the specific comment with the trends. Each directive is a concrete code change, for example "lower the trail alpha so trails last about four times longer" or "add a third oscillator at half the base frequency".

- "More abstract": more noise octaves or deeper transformations
- "More realistic": add physical constraints or constants
- "Other colors": a curated palette in the direction the trends favor

## 4. Implement as a new version

- Copy `sketch/{name}` to `sketch/{name}_v{n+1}` and change only the copy. Never overwrite the original
- Keep the identity: same core algorithm and theme; refine parameters, colors, and complexity
- Regenerate the previews with the standard names
- Check the result against the directives and the critique axes. If it misses the comment, adjust once more

## 5. Document and commit

- `README.md` of the new version: what changed from the previous version and why
- `WORKS.md`: a new entry for the version
- `FEEDBACK.md`: a new empty entry for the version. Do not touch the user's fields
- Commit as `polish: {name}_v{n} - {main improvement}`, then archive the outputs

If a comment asks for motion on a still work, make the new version an animation.
