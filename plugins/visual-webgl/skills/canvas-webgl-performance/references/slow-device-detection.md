# Detecting slow devices during playback

## What to measure

Use the intervals between `requestAnimationFrame` callbacks while the heavy phase is drawing. Do not judge before the heavy phase starts. The early phases are light, so every device looks fast there.

## Rule

```js
const gaps = [];
const onFrame = (gap, progress) => {
  if (decided) return;
  gaps.push(gap);
  if (gaps.length < SKIP + WINDOW) return;   // skip the first frames: they include one-off setup
  const recent = gaps.slice(-WINDOW).sort((a, b) => a - b);
  const median = (recent[WINDOW / 2 - 1] + recent[WINDOW / 2]) / 2;
  if (median > SLOW_FRAME_MS) { decided = true; switchToLighterRendering(); }
  if (progress >= GIVE_UP_AT) decided = true; // too late for a switch to look intentional
};
```

- **Median of a short window** (about six frames): a single long frame (garbage collection, a tab switch) does not trigger it, but sustained slowness does within a tenth of a second
- **Skip the first couple of frames** of the phase: they include the first-draw cost even after warming up
- **Stop judging after most of the phase**: switching near the end looks like a glitch rather than a design choice
- **Reset** the state when the animation restarts (replay in the mock, resize to another breakpoint)

## Choosing the threshold

- Below the frame time of the slowest device that should still get the full rendering, measured on real hardware
- Clearly above a 60 Hz frame (16.7 ms) and above the steady frame time under CPU throttling on capable machines. Otherwise fast devices switch for no reason
- A value around a 30 fps frame time is a typical starting point; confirm it against the measurements and write the reason in the spec
- Expose it as a tunable value (and allow 0 to disable) so it can be tested in the mock by lowering it

## The lighter rendering

Switch to a fade of a prerendered final-state image, and load that image only at the moment of the switch. Mark the root with a state class (`--slow`) so tests and the performance script can see what happened.
