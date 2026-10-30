---
name: manage-device-credentials
description: Keeps Wi-Fi passwords, broker keys, API keys, and service-account files for microcontroller and IoT projects out of git while sketches still compile - a gitignored credentials.h with a committed placeholder example, guarded defaults in config.h, secrets kept separate from pins and thresholds, ignore rules for specific files instead of whole extensions, and the Arduino Cloud web editor's secrets file handled as its own case. Use when the user says things like "where do I put my Wi-Fi password", "I committed my API key", "the sketch doesn't compile without credentials", "set up credentials.h", or "ignore secret files".
---

# Manage device credentials

Starter files, in this repository: `templates/arduino/sketch/Template/credentials.h.example`, `config.h`, and `templates/electronics/gitignore.snippet`.

## 1. Files

| File | Committed | Contains |
| --- | --- | --- |
| `credentials.h.example` | yes | Every secret's name with a placeholder value |
| `credentials.h` | **no** (gitignored) | The real values, per developer and device |
| `config.h` | yes | Pins, intervals, thresholds, and `#ifndef` defaults for anything credentials might omit |

Include `credentials.h` only if it exists (`#if __has_include("credentials.h")`), then `config.h`. A fresh clone then compiles with network features disabled instead of failing, and CI can build without secrets.

## 2. Ignore rules

List each secret file in `.gitignore` (`credentials.h`, `.env`, `service-account-key.json`, `*.pem`). Do not ignore whole extensions like `*.json`: configuration and sample payloads must stay tracked. Check `.gitignore` before introducing a new local file.

## 3. Arduino Cloud web editor

Projects uploaded from the web editor use the `arduino_secrets.h` it generates from its Secret tab. Commit that file only with empty values and enter real values only in the Secret tab. Keep this exception documented, since it contradicts the general rule.

## 4. Cloud side

Functions read secrets from environment variables or a secret manager, never from files in the repository. README examples and test payloads use placeholders.

## 5. If a secret was committed

Rotate it first (new Wi-Fi password, new key), then remove it from the files. Deleting the file does not remove it from history, and anything pushed should be treated as public.
