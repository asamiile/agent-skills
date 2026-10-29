# Performance log

Measure before and after each optimization under the same conditions, and add the results here. The workflow is in the `web-animation:measure-animation-performance` skill.

## How to measure

- Page: {page}. Settings: defaults unless noted
- Throttled runs: `pnpm test:perf` (headless; add `HEADED=1` for GPU-like frame times)
- Real devices: the mock's measure button (play from the start; average fps, longest frames with their timeline positions, frames over 20 ms)
- Data: Resource Timing, counting only files that ship

## {YYYY-MM-DD}: {what changed}

Environment: {device, browser, refresh rate, devicePixelRatio, canvas size}

| Condition | Ready (PC / SP) | Done (PC / SP) | Data (PC / SP) | Median frame | Longest frames (timeline position) | Over 20 ms |
| --- | --- | --- | --- | --- | --- | --- |
| No throttling | | | | | | |
| Fast 4G | | | | | | |
| Slow 4G | | | | | | |
| CPU 4× | | | | | | |
| CPU 6× | | | | | | |

| Device | Average | Longest frames (timeline position) | Over 20 ms | Looks |
| --- | --- | --- | --- | --- |
| | | | | |

- What the numbers mean:
- Next step:
