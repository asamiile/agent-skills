# QA

Items to check before delivery. The specification is in `SPEC.md`.

- Automated: checked by commands (Chrome on macOS and Windows). Results appear in the terminal
- Manual: checked by eye and on real devices. Mark `[x]` when checked and write problems in the notes
- When a feature changes, review both the automated tests and the manual items

## Automated

| Command | What it does |
| --- | --- |
| `pnpm test` | Checks the items below (the first run saves screenshots as baselines) |
| `pnpm test:update` | Rewrites the baselines after an intended visual change |
| `pnpm test:frames` | Contact sheet of the animation (no pass/fail) |
| `pnpm verify` | lint, typecheck, package, and test together |

- Run in your own terminal (a sandbox cannot start the browser or the server)
- Uses the installed Google Chrome. Safari and Android are checked manually
- Results in `test-results/`: `baseline/` (per OS), `actual/`, `diff/` (changed pixels in red)

| Group | What is checked | Viewports |
| --- | --- | --- |
| Display | Final state matches the baseline; no horizontal overflow | {all test viewports} |
| Animation | Plays without errors and stops in the final state | {PC}, {SP} |
| Animation | Crossing the breakpoint during playback jumps to the final state | {PC} → {SP} |
| Resize | After playback, PC → SP → PC keeps the final state; canvases redraw at the new size | |
| Fallback | Reduced motion: final state at once | |
| Fallback | CDN library blocked: final state at once | |
| Fallback | JavaScript disabled: final state at once | |
| Fallback | Main script missing: hidden at first, final state after the safety-net delay | |
| Fallback | Data too slow or missing: final state | |
| Fallback | {API} unavailable: {expected behavior} | |

- [ ] `pnpm verify` passes (date: )

## Manual

Items covered by automated tests are left out. Run these after the automated tests pass.

### Environments

| OS | Browser | Device / width | Date | Result |
| --- | --- | --- | --- | --- |
| Windows | Chrome | PC ({widths}) | | |
| Windows | Edge | PC | | |
| macOS | Chrome | PC | | |
| macOS | Safari | PC | | |
| iOS | Safari | iPhone (real device) | | |
| Android | Chrome | Android (real device) | | |

### 1. Display (still)

- [ ] Positions, sizes, and colors match the design data and the preview images
- [ ] Images are sharp on high-density screens
- [ ] No gaps or lines around the component

### 2. Animation

- [ ] The phases play in order: {phase 1} → {phase 2} → {phase 3}
- [ ] Timing and easing feel natural
- [ ] No stutter or flicker (mock's measure button: about {target} fps or more)
- [ ] Nothing half-built is visible while loading; the component fades in when ready
- [ ] Nothing jumps at the moment playback starts

### 3. Fallbacks (OS settings and browsers other than Chrome)

- [ ] macOS/iOS "Reduce motion" on: final state at once (Safari)
- [ ] Windows "Animation effects" off: final state at once
- [ ] Android "Remove animations" on: final state at once
- [ ] The final-state images match the design (PC and SP)

### 4. Viewport and navigation

- [ ] Keeps proportions at every PC width
- [ ] Switches cleanly around the breakpoint
- [ ] Rotating a phone keeps the layout
- [ ] Reload plays from the start
- [ ] Back button after leaving the page: no blank state, both mid-animation and after it finished
- [ ] Switching tabs during playback and coming back continues from where it stopped
- [ ] A page opened in a background tab plays from the start when first shown

### 5. Performance

- [ ] Total image size checked (packaging output)
- [ ] Slow network (DevTools "Fast 4G" or slower) does not break the display
- [ ] Low-end devices: little stutter; the slow-device fallback triggers only where intended
- [ ] Lighthouse: no major issues in LCP and CLS

### 6. Accessibility

- [ ] Screen readers read the text content
- [ ] Decorative images are not announced (`alt=""`, `aria-hidden`)
- [ ] Text contrast is sufficient

### 7. Deliverable

- [ ] `dist/index.html` looks and moves the same as the preview page
- [ ] `dist/embed.html` (or equivalent) contains every part, in order
- [ ] No mock files, `.ts`, or unused images in `dist/`
- [ ] Shipped documents are up to date
- [ ] The client's name appears nowhere in code, file names, or comments

## Notes

| Date | Environment | Issue | Action |
| --- | --- | --- | --- |
| | | | |
