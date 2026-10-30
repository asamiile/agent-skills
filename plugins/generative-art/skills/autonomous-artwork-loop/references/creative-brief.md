# Creative brief

## Theme first

The algorithm is a means, not the starting point. Before choosing a technique, write the work in one sentence about a feeling or situation:

- "The silence after a sound fades" → sparse trails, slow decay, muted tones
- "Something eroding under pressure over time" → dense layered texture, dark earth palette
- "Chaos that almost organizes itself" → near-symmetric structures that break at the edges

Then pick the technique that serves that sentence.

## Finding the gap

1. List the themes, techniques, and visual styles in `WORKS.md`. Mark what is over-used (particles, noise fields, night skies are common traps)
2. Weight by feedback: move toward works rated OK, away from works rated NG. Treat comments as direct constraints ("less geometric" → organic or growth processes). Ignore entries with no rating yet
3. Prefer a fresh theme combined with an under-used technique. Differ from the most recent ten works in theme, technique, and look
4. Never repeat a theme + technique pair already in the catalog

## Format

```text
## Creative Brief

### Work name
{snake_case_name}

### Theme
{one sentence about feeling or situation, not the algorithm}

### Technique
{method + one line on how it serves the theme}

### Color palette
- Background:
- Dominant (60%):
- Secondary (30%):
- Accent (10%):
- Mood: {dark/moody | warm/organic | cold/precise | quiet/minimal | vibrant/neon | graphic/bold}

### Visual impression (first 3 seconds)
{what the viewer sees and feels before reading any label}

### Format
{Still image | Animation (N s @ fps)}

### Post-processing
{none | finishing pass | GPU field | both} - {one-line reason}

### References
{optional, at most 3 algorithm references with the reason for each}

### Rationale
{one sentence: which gap this fills}
```

## Rules

- If the caller fixed the format (still or animation), use it
- Choose animation only when motion is essential to the idea; state the duration
- Post-processing (bloom, grain, tone mapping, shader fields) is optional and should vary across works. Choose it when light emission, a cinematic finish, or a per-pixel field the CPU cannot render at full resolution serves the theme
- References support the concept; never choose a concept only because an algorithm is available
