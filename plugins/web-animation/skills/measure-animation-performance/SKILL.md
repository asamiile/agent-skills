---
name: measure-animation-performance
description: Measures load time and smoothness of a web animation under throttled network and CPU conditions and on real devices, records the numbers before and after each optimization under identical conditions, and uses them to choose timeouts and slow-device thresholds. Use when the user says things like "is the animation janky", "measure the performance", "check it on slow phones", "how long does it take to start on 4G", "did the optimization help", or "it stutters on Windows/Android".
---

# Measure animation performance

Starter code, in this repository: `templates/web-animation/tests/perf.mjs` and `templates/web-animation/PERF.md`. The script uses `tests/lib/browser.mjs` (see `web-animation:visual-regression-test`) and the state classes from `web-animation:animation-fallbacks`.

## 1. Decide what to measure

| Metric | Why |
| --- | --- |
| Time until ready (`--loaded`) | How long visitors look at an empty area. Compare with the loading timeout |
| Time until done (`--complete`) | Total length as experienced |
| Bytes transferred, per file | What to shrink first |
| Frame intervals during the animation: median, maximum, count over 20 ms | Median shows the steady cost; maximum and the count show visible hitches |
| Where in the timeline the longest frames happen | Tells which phase to optimize |
| Whether a fallback was used (`--slow`, `--static`) | Thresholds must not trigger on capable devices |

## 2. Run the throttled measurement

`pnpm test:perf` runs each combination of these conditions and viewports, prints a line each, and writes `test-results/perf.json`:

- No throttling, Fast 4G, Slow 4G (network emulation through the Chrome DevTools Protocol)
- CPU 4× and 6× slower (`Emulation.setCPUThrottlingRate`)

Headless Chrome may render without the GPU, so frame times there are pessimistic. Run once with `HEADED=1` for numbers closer to real GPU rendering. Load times are reliable either way.

## 3. Measure on real devices

Throttling a fast machine does not reproduce a slow GPU. Measure on real devices too:

- Serve the dev build to the local network (`pnpm dev:lan`, only on a trusted network) and open it on phones, tablets, and Windows laptops
- Put a measuring button in the mock's player bar: play from the start and report average fps, the longest frame with its timeline position, and the count over 20 ms (see `gsap:animation-tuning-mock`)
- Cover at least: Mac Chrome and Safari, Windows Chrome and Edge, iPhone Safari, a recent Android, and a low-end Android or tablet

## 4. Record before and after

Keep `PERF.md` in the project. For every optimization:

1. Write down the environment and conditions (device, browser, screen refresh rate, `devicePixelRatio`, canvas size, the settings being changed)
2. Measure before, apply one change, measure again under the same conditions
3. Note what the numbers mean, not only the numbers ("long frames moved from the end of phase 3 to the first frame, while the component is still transparent")

Changing several things at once hides which one helped. See [references/reading-results.md](references/reading-results.md) for how to interpret common patterns.

## 5. Turn results into settings

- Loading timeout: longer than the slowest start you want to animate (for example Slow 4G), with a margin. If the margin is small, shrink the data first
- Slow-device threshold: below the frame times of the slowest device that still looks smooth, and above the occasional single long frame. Verify that CPU throttling does not trigger it on capable machines
- Write each chosen value and its reasoning into the project's spec
