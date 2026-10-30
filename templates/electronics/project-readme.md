# {Project name}

[English](README.md) | [{Other language}](README.{lang}.md)

## Overview

{What it does, in two or three sentences. A photo or diagram.}

## Bill of Materials

### Control

| Part | Qty | Role |
| --- | --- | --- |
| {board} | 1 | {main controller} |

### Input and output

| Part | Qty | Role |
| --- | --- | --- |
| {sensor / actuator} | | |

### Power

| Part | Qty | Role |
| --- | --- | --- |
| {supply} | | {voltage, current; shared ground} |

## Development

### Hardware

Wiring, one line per connection:

- {Board} {port or pin} -> {component} {pin}

{Power notes: external supply for motors, common ground, polarity.}

### Software

1. Connect the board over USB.
2. Open `sketch/{Name}/{Name}.ino`.
   - The board, core, and libraries are pinned in `sketch/{Name}/sketch.yaml`.
3. Copy `credentials.h.example` to `credentials.h` and fill in {which values}.
   - See [Credentials](../../../../docs/credentials.md) for where each value comes from.
4. Compile and upload: `arduino-cli compile sketch/{Name}` then `arduino-cli upload sketch/{Name} -p {port}`.
5. Open the serial monitor and check {expected output}.

Each step's details go as indented bullets right under it, naming the exact file, setting, and value.

### Cloud (if any)

{One-line link to the shared cloud guide, a diagram of the data flow, then numbered steps with the exact names: feed or table, function, broker topic, webhook.}

### Test

- {What to check and the expected result, grouped by feature}
- {Failure cases: Wi-Fi lost, sensor missing, broker down}

## References

- {Datasheets, library docs}
