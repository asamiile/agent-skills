# Search and ranking over a manifest

A manifest of a few hundred to a few thousand entries does not need a search engine. Score entries in memory on each call; it takes milliseconds and keeps the server dependency-free.

## Scoring

Build one lowercase text per entry from the descriptive fields (title, category, use, concepts, good_for). Then add points:

| Match | Weight (starting point) |
| --- | --- |
| The whole query appears as a phrase | 8 |
| A token equals one of the entry's concepts | 4 |
| A token equals the category | 3 |
| A token appears anywhere in the text | 2 |

Sort by score, then by path, so equal scores come back in a stable order. Tune the weights against a handful of real queries and keep those queries as tests.

## Synonyms

A small hand-made table that expands a query word into related words (`flow` → `fluid`, `stream`, `vector field`) fixes most "nothing found" cases. Keep it specific to the content's vocabulary; a generic thesaurus adds noise.

## Intent profiles

When users think in moods or purposes rather than techniques, a profile maps a name to categories, concepts, and tags, each with a weight. Free-text style words then re-rank inside the profile's results. For an unknown profile name, return the valid names instead of an empty result.

## Combination recipes

Recipes describe layered results by role (for example background, moving elements, texture, overlay), each role with a query and an optional category. Resolve each role through the normal search when the tool is called, and return the top one or two candidates per role. Recipes then never hold stale paths, and new entries show up in them automatically.

## Keep the data separate

Put synonym tables, profiles, and recipes in their own module or JSON file, not inside the tool functions. They change more often than the code and are easier to review on their own.
