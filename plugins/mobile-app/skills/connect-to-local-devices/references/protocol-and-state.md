# Protocol and state between an app and a local server

## Messages

```text
app → server   {"type": "command", "action": "set_tempo", "params": {"value": 120}, "id": "optional"}
server → app   {"type": "response", "id": "...", "ok": true, "error": "only when ok is false"}
server → app   {"type": "state", "topic": "tempo", "value": 120}
```

- Responses exist only for commands that carried an `id`, so fire-and-forget commands cost nothing
- A dedicated `ping` action lets discovery tell this server apart from anything else on the port
- On connect, the server sends the full current state as a series of `state` messages

## One definition per side

Define the message shapes in one module on the server and one type file in the app, and name each file in the other's header comment. A change to one is a change to both, in the same pull request. Reject malformed messages quietly; never let one bad message stop the server's loop.

## Source of truth

The server owns the state. The app can show a change immediately (optimistic update) for responsiveness, but it stores the server's next `state` message as the truth, which also corrects changes made directly on the server. Do not keep a separate "intended" state on the app that can drift.

## Ordering and latency

Over a local network, messages arrive in order on one socket. If the server processes input on a timer (for example once per 100 ms), expect that much delay and design controls (sliders) to send at most once per interval.
