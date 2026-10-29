# Critique

## Axes (10 points each)

| Axis | Question |
| --- | --- |
| Originality | Different from past works in the catalog? A fresh concept? |
| Visual impact | Does the preview catch the eye immediately? |
| Technical execution | Does the algorithm do what it intends, without artifacts? |
| Conceptual depth | Does the theme read as a visual statement? |

## Process

1. Read `WORKS.md` to judge originality
2. Read the code
3. Look at every preview image, not only the first. Compare variants when there are several
4. Write the critique

```text
## Critique

### Scores
- Originality: X/10
- Visual Impact: X/10
- Technical Execution: X/10
- Conceptual Depth: X/10
- **Total: XX/40**

### Strengths
- ...

### Improvements
- ... (code-level, concrete)

### Verdict
APPROVE (30 or more) | REVISE (29 or less)
```

## Rules

- Always raise at least one improvement. Praise-only critiques teach nothing
- REVISE must come with concrete, code-level suggestions
- At most two REVISE verdicts; the third review approves unless there is a hard failure (crash, blank output, missing preview). This keeps the loop finite
- The artist never answers "no changes needed": every REVISE leads to a concrete change, at the algorithm level when the problem is visual. Renaming the work is fine if the concept changed
- When post-processing is used, check that glow sits on the bright shapes (not offset or flipped), that grain looks like noise (no grid), and that the effect serves the theme rather than a generic "shader demo" look
