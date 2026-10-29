# Reading performance results

## Median versus maximum

- High median, few spikes: the steady per-frame work is too heavy. Reduce work per frame
- Low median, a few very long frames: one-off work (shader compilation, first draw, texture upload, garbage collection, decoding an image). Move it before playback, while the component is still transparent
- Apple devices often show many frames slightly over 20 ms but no long ones, and look smooth. Windows and Android more often show few slow frames but single hitches of hundreds of milliseconds, which are visible. Judge by the longest frames and by eye, not by averages alone

## Where the long frames are

Record the timeline position of each long frame. Long frames at time 0 are setup work and are harmless when the component is still transparent. Long frames late in a phase usually mean the work grows with progress (more geometry, more layers), so the end of the phase is the worst case to optimize for.

## Pixel fill versus number of draw calls

Lowering canvas resolution helps when the GPU is limited by the number of pixels painted. It does nothing when the cost is the number of draw calls or state changes. Test both separately: halve the resolution, then halve the number of drawn layers. The one that helps tells you which limit you hit, and it can differ between devices. See `visual-webgl:canvas-webgl-performance`.

## Headless numbers

Headless Chrome frame intervals can look like 60 fps on a 120 Hz machine and can hide GPU behavior. Use headless runs for load times and relative comparisons, and headed runs or real devices for smoothness.

## Load size

Often one data file dominates. Sorting the data and storing differences between neighbors, with variable-length integers, can shrink it a lot and also compresses better with gzip or Brotli. Check that the decoded data is identical to the original after such a change.

## `loading="lazy"` near the first screen

Chrome starts fetching lazy images when they are within a large distance from the viewport (well over a thousand pixels on desktop). An image just below the first screen is fetched immediately anyway. It does no harm, but do not count on it to save bytes there.
