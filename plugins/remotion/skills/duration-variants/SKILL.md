---
name: duration-variants
description: Adds fixed-length versions of short Remotion animations (for example a 5-second version of a 1.2-second transition, to meet a stock site's minimum duration) without changing the motion - the base keeps its own length and ID, the padded version gets a suffix, transparent margins center the animation, and a check compares stills of both. Use when the user says things like "make a 5-second version", "this transition is too short for Adobe Stock", "pad the animation to N seconds", or "the -5s version looks different from the original".
---

# Duration variants

## 1. Rules

- The base composition keeps its original duration and its unsuffixed ID. Never stretch the base just to meet a length requirement
- The padded version has a fixed suffix (for example `-5s`) and exactly N seconds (`N × fps` frames)
- The animation keeps its speed in both. The padded version adds transparent (or held) margins before and after, centering the animation
- Register both in the same Studio folder; outputs share the base's folder (`<BaseId>-5s.mp4`, `png-5s/`)
- Keep the shortest version tight: only the frames needed for the animation to start and end, no idle time
- Make sure nothing repeats or freezes unintentionally in the extended part
- When props change the animation length, compute both durations in `calculateMetadata`

## 2. Implementation

- List the families or IDs that get a padded version in one config file (prefixes or IDs, the seconds, the suffix). Registration, enumeration, export, and verification all read it
- Register the padded version from the same component and the same props; only the duration and an offset differ
- Inside the component, compute `animationFrame = frame - offset` and drive everything from it. In shaders, pass `animationFrame / fps` as the time uniform instead of a built-in "seconds since frame 0"
- Include both versions in every batch export and in `all`

## 3. Verification

Without rendering full videos:

1. Bundle, then list compositions with `@remotion/renderer` (`getCompositions`, Chrome with `gl: 'angle'` when WebGL is involved)
2. For every base in the config, assert the padded ID exists, has exactly `N × fps` frames, is longer than the base, and has the same props
3. Assert that every other composition meets the project's minimum duration
4. Render a few stills of corresponding frames from both versions (`renderStill`) and compare their pixels. Equal stills prove the animation was not retimed
