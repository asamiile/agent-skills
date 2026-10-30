# AGENTS.md

Template for a project that delivers an animated web component (a hero animation, key visual, or intro sequence) as static HTML, CSS, and JavaScript. Replace the `{...}` placeholders and delete what does not apply.

## Project

- Deliverable: {the component's HTML, CSS, JavaScript, data, and images}, plus a standalone preview page (`index.html`)
- Embedding into {the client's site / CMS} is {in scope / done by the client's developer}

## Read before working

- `.agents/SPEC.md`: specification (deliverables, the animation's phases, fallbacks, decisions and their reasons)
- `.agents/SECURITY.md`: security policy (always follow it)
- `.agents/TASKS.md`: tasks (tick them off after the work)
- `.agents/QA.md`: test items (update when features change)
- `.agents/PERF.md`: performance log (measure before and after optimizations under the same conditions)

## Source material

- Provided material is in `docs/{folder}/`. Treat it as read-only: do not change, move, or delete it
- Put exported assets and work files outside `docs/`

## Structure

- `public/`: everything that is served
  - `index.html`: preview page (shipped). Holds the canonical markup of the component
  - `mock.html`: tuning page (not shipped). Uses the same component scripts as `index.html`
  - `assets/css/{prefix}.css`, `assets/js/{prefix}.ts` → `.js`, `assets/data/`, `assets/images/`
  - `assets/js/mock/`, `assets/css/mock*.css`: mock-only code
- `tests/`: browser tests and capture scripts (not shipped). Results go to `test-results/` (not tracked)
- `delivery/`: documents shipped with the deliverable
- `scripts/`: packaging and the preview server

## Rules

- Class names: BEM with the prefix `{prefix}` (`{prefix}__element--modifier`). The prefix must not contain the client's name
- State classes on the root: `--ready`, `--loaded`, `--static`, `--complete`, `--slow`
- Positions and sizes from the design: convert from the design's artboard coordinates with one unit variable (`--{prefix}-u` = component width ÷ artboard width). Gather them as custom properties on the root and override them in media queries for other breakpoints
- Breakpoint: {width}. Write media queries as `(max-width: {width - 0.02}px)` so fractional viewport widths match the site, and avoid range syntax for older Safari
- Container units (`cqw`) with a `@supports not (width: 1cqw)` fallback to viewport units
- Adjustable values in one `DEFAULTS` object. The component hands its API to `window.__animDebug` when it exists, otherwise autoplays
- Edit `.ts`, never the generated `.js`. Shipped scripts are IIFEs without `import`/`export`
- External libraries from a CDN, with a pinned version and `integrity` (SRI). Keep the npm package at the same version when its types are needed
- Mock-only files have `mock` in their name or folder. The packaging script stops if one would ship
- No inline `style` attributes in the shipped markup (CSP)
- Every case in SPEC.md's fallback table has an automated test

## Comments

- Shipped files (`{prefix}.ts`, `{prefix}.css`, `index.html`) are read by the client and the people who embed them. Write what each part does and where to adjust it, in one or two lines
- Keep development history, trial results, and references to SPEC.md, mocks, or tests out of shipped files
- HTML comments name the block only

## Commands

- `pnpm dev`: compile TypeScript in watch mode and start the dev server on localhost (run in your own terminal)
- `pnpm dev:lan`: the same, visible on the local network for real devices (trusted networks only)
- `pnpm preview`: static server without live reload (for checking the back/forward cache)
- `pnpm lint`, `pnpm typecheck`: must pass after every code change
- `pnpm test`, `pnpm test:update`, `pnpm test:dist`: browser tests (run in your own terminal)
- `pnpm test:frames`, `pnpm video`, `pnpm test:perf`: contact sheet, MP4, performance
- `pnpm package`: build the deliverable into `dist/` and `release/*.zip`
- `pnpm verify`: lint, typecheck, package, and test before delivery

## Working rules

- Ask the user when the specification is unclear; do not guess
- Update SPEC.md and TASKS.md when the specification or tasks change
- Ask before adding an external library
- Commit only when the user asks
