---
name: write-artwork-article
description: Writes a technical article about one generative artwork or creative-coding sketch for a blog platform such as Medium, dev.to, or Zenn - concept, visual approach, the two or three key code sections explained, and links - from the sketch's code, README, and catalog entry. Use when the user says things like "write a blog post about this sketch", "make a Medium article for this work", "explain how this piece was made", or "draft a making-of".
---

# Write an article about an artwork

## 1. Gather the sources

- Ask for the work name if it was not given, and confirm the folder exists
- Read the sketch's code (always), its `README.md` (if present), and its entry in the catalog
- Ask the user for the links to put at the end (video, source, portfolio, shop, support). Do not invent them; keep them in the project's settings, not in the skill

## 2. Structure

1. **Title**: under 80 characters, names the visual concept, for a creative-coding audience
2. **Introduction** (2-3 paragraphs): what the work is, what it looks like (so a reader can picture it without the image), and why this tool suited the idea
3. **Visual approach**: rendering technique, geometry, lighting, palette, and the key algorithms
4. **Code breakdown**: the 2-3 most important parts, 10-30 lines each, explaining why the technique works, not only what the code does. Depth on one idea beats shallow coverage of many
5. **Conclusion**: one paragraph on what makes the work interesting or what was learned, then the links

## 3. Tone

| Item | Spec |
| --- | --- |
| Audience | Developers and creative coders |
| Tone | Logical, insightful, concise, not hype |
| Length | 800-1200 words |
| Language | The user's choice; default to the platform's main audience |

## 4. Platform constraints

Check what the target editor accepts before formatting. Medium's editor, for example, does not render Markdown tables or Markdown image syntax, so describe images in text and let the user insert them, and turn tables into lists. Leave out front matter unless the platform needs it.

## 5. Output

- Write to a drafts folder that is ignored by git (for example `articles/YYYY-MM-DD_{work_name}.md`)
- Do not modify the sketch or the catalog, do not run the sketch, and do not commit
- Report the title and the file path, and remind the user to paste it into the editor and add images
