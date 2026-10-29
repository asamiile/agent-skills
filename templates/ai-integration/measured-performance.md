# Measured performance: {component}

Record real measurements before choosing defaults, and say what was decided because of them.

## Environment

- Machine: {model}, {CPU/GPU}, {RAM}
- Runtime: {Docker Desktop version}, memory allocated: {GB}; GPU passthrough: {yes/no}
- Model and settings: {checkpoint or model}, {steps}, {sampler}, {precision}

## Results

| Stage | Size | Result | Time | Peak memory | Date |
| --- | --- | --- | --- | --- | --- |
| {preview} | {1024x1024} | Success | {7 min} | {GB} | {YYYY-MM-DD} |
| {final} | {2048x2048} | Success / OOM | {1 h 14 min} | {GB} | |
| {final} | {3840x2160} | Not attempted | {extrapolated: x h} | | |

How the extrapolation was made: {for example, doubling each side took ~9x the time}.

## Failures and fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| {container killed while loading the model} | {memory allocation too small} | {raised to x GB} |

## Decision

{What the defaults are and why, for example: final outputs default to a cloud provider; local stays available for previews.}
