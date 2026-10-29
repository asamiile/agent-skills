# Writing rules for technical explanations

Rules that came out of sentence-by-sentence review of technical learning content. Most apply in any language; the last section lists ones specific to Japanese.

## Who is writing

Pick one narrator and keep it: for technical material, an experienced engineer explaining to a colleague who will do the same work. Calm, assertive statements; no hype or exaggerated encouragement; formal vocabulary instead of slang verbs. Give the reason behind a decision in one short sentence.

## Say who does what

Every sentence has a readable subject:

- Passive voice without an agent ("a token is issued"): name who issues it (the server, the client, the API designer)
- Things that "just happen" ("then the response grows"): name what makes it happen
- A subject that changes mid-sentence: split the sentence
- Decide first whether a paragraph is about the side that decides (server, designer) or the side that receives (client, reader), and keep that subject; do not repeat it in every sentence

## Be concrete

- Headings, descriptions, and goals name the actual thing and action, so a reader can picture the content from the heading alone. Put the specific names (header names, the conclusion) in the heading, not "How X works" or "About X"
- Replace metaphors and vague references with the real object ("a long secret value" → "an API key")
- Do not describe an action only with "look at" or "go through"; say what is checked, compared, or tried, and on what
- Self-check: if someone reading only this sentence would ask "what is that?" or "who does that?", rewrite it

## Sentences

- A condition needs its result: not "AND is both, OR is either", but "AND gives 1 when both inputs are 1"
- Introduce the counterpart before a contrast ("only one input" needs the earlier statement that others take two)
- Do not state a cause as a vague negative that can be read backwards; say what actually happens
- Define a term in its own sentence the first time it appears; a parenthetical alone is not a definition
- Avoid parenthetical asides in general; restructure the sentence so it carries the information
- Cut adverbs that add no meaning ("first" when there is no sequence)
- When a diagram shows a result, label which rule produced it
- Every noun used in the UI is named in the overview text at least once

## Consistency

- Fix a term everywhere in the unit when you fix it once
- Keep the step instructions in one fixed form

## Japanese-specific

- No colons (full-width or half-width) in prose; rewrite with a connective form or split the sentence
- Too many short sentences: join related ones with the te-form, but keep the comma between a condition and its conclusion
- Use the formal written register throughout (desu/masu, assertive endings)
- For information or secrets getting out, use the word for "leak" in the security sense, not the everyday word that also means "omission"
