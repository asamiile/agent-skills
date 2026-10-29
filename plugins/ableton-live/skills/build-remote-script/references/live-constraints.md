# Live's embedded Python: constraints

## No threads

Starting a thread from a Remote Script makes Live stop responding. All I/O happens in the tick that Live calls on its main thread: `schedule_message(1, self._tick)` re-schedules itself each time (about every 100 ms). Every socket is non-blocking; a poll that would block returns immediately.

Consequences: latency is up to one tick; keep the work per tick small (read what is available, parse, write what fits); never sleep or wait.

## No pip

Only the standard library is available. That is why the WebSocket server is written by hand (`socket`, `hashlib`, `base64`, `struct`). Keep it to the subset the protocol needs and enforce limits, since nothing else protects Live from a misbehaving client.

## Exceptions

An uncaught exception in the tick stops the re-scheduling, and the server silently dies. Wrap the tick body, log the exception, and always schedule the next tick.

## Module cache

Live keeps imported modules until it quits. Re-selecting the Control Surface reuses the old code. Restart Live after each change.

## Port conflicts

If the port is taken, binding fails and the script does nothing visible. Show the error in the status bar (repeatedly). If conflicts become real, try a short fixed list of ports rather than a random one, so clients that are given only an IP address can still find the server.

## Discovery from phones

A phone app can find the computer by trying each address of its own /24 subnet and sending an application-level `ping` that only this script answers. UDP broadcast or multicast discovery would avoid the scan, but iOS requires a special multicast entitlement from Apple for receiving it. See `mobile-app:connect-to-local-devices`.

## Listeners

Register through one helper that records `(target, property, callback)`, and remove all of them in `disconnect()`. Objects such as tracks can disappear while listened to; removal must tolerate that. When the set of tracks changes, re-register track listeners.
