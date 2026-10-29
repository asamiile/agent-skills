---
name: build-remote-script
description: Builds an Ableton Live Remote Script (a Control Surface script in Live's embedded Python) that lets another app - a phone controller, a web page, a tool - control Live and receive its state over WebSocket on the local network, with no threads, a polled non-blocking socket server written with the standard library only, JSON commands and pushed state from Live listeners, tests that run without Live, and installation and reload instructions. Use when the user says things like "control Ableton from my phone", "make a Live remote script", "send Live's tempo to my app", "the control surface doesn't show up", "Live hangs when my script starts", or "my script changes don't take effect".
---

# Build an Ableton Live Remote Script

Starter code, in this repository: `templates/ableton-live/RemoteBridge/` (`__init__.py`, `surface.py`, `handlers.py`, `protocol.py`, `ws_server.py`) and `templates/ableton-live/tests/`. Rename the `RemoteBridge` folder: its name is what Live lists under Control Surface. Constraints and the reasoning behind them: [references/live-constraints.md](references/live-constraints.md).

## 1. Choose the integration

Check what each option can do before building. A Remote Script can call and observe the Live Object Model from inside Live (transport, tempo, tracks, devices, undo) and run a socket server. Official extension SDKs, MIDI mapping, and OSC tools each cover less; read their current API for the exact properties and listeners you need.

## 2. Structure

- `create_instance(c_instance)` in `__init__.py` returns the Control Surface. Import Live modules only there and below, so tests can import the rest
- `surface.py`: one tick every ~100 ms with `schedule_message`, which polls the socket server. **No threads**: a thread in a Remote Script hangs Live
- `ws_server.py`: non-blocking WebSocket server, standard library only (Live's Python has no pip). Limits on header and message size and on client count; unmasked or fragmented frames close the connection
- `protocol.py`: `command` (client → Live, optional `id`), `response` (only for commands with an id), `state` (pushed on every change). Mirror the shapes in the client's types
- `handlers.py`: one handler per feature declares its actions, validates parameters before touching the song, registers listeners with `add_<prop>_listener`, and removes them on `disconnect`

Live is the source of truth: clients may update optimistically, but each change Live reports through a listener is pushed as `state` and overrides the client.

## 3. Map features to the Live API

Write a table before coding: feature → call (for example `song.start_playing()`, `song.tempo = x`) → listener (`add_is_playing_listener`) → type and valid range. Do not invent property names; check them against the Live Object Model reference for the Live versions you support.

## 4. Test without Live

```sh
python3 -m unittest discover -s tests
```

`test_ws_server.py` covers the frame codec, limits, and a real socket round trip; `test_surface.py` runs the Control Surface against a fake `ableton` module and a fake song, so dispatch, errors, initial state, and listener cleanup are tested. Behavior inside Live (latency, real listeners) still needs a manual check in Live.

## 5. Install and reload

- macOS: `~/Music/Ableton/User Library/Remote Scripts/{Name}/`; Windows: `%USERPROFILE%\Documents\Ableton\User Library\Remote Scripts\{Name}\`. The `Remote Scripts` folder does not exist until someone creates it
- Then Preferences → Link, Tempo & MIDI → Control Surface → `{Name}`
- After changing the code, **quit and restart Live**. Selecting the surface again does not reload Python modules
- For development, symlink the folder from the repository; for users, ship an installer (`core:ship-companion-installer`)
- Logs: Live's `Log.txt` in its preferences folder; the script also shows its address in the status bar, repeated for a while because Live hides status messages after a few seconds

## 6. Network trade-offs

The server listens on all interfaces without TLS or authentication: Live's Python cannot add those libraries, and the design assumes a trusted home or studio network. State this in the user documentation, and keep the action set limited to what the controller needs.
