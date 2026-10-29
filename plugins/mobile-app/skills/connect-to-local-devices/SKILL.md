---
name: connect-to-local-devices
description: Connects a smartphone app to a server on the same Wi-Fi network (a desktop app, a music or lighting rig, a home device) - the iOS and Android permissions and cleartext settings it needs, finding the server by scanning the subnet with an application-level ping, saving several connections, a command/response/state protocol where the server is the source of truth, and the security trade-offs to write down. Use when the user says things like "connect my app to my PC on the same Wi-Fi", "auto-detect the computer", "the app can't reach the local server on iOS", "local network permission", or "ws:// is blocked in the release build".
---

# Connect an app to a device on the local network

Starter files, in this repository: `templates/mobile-app/src/lib/discovery.ts` (+ `discovery.test.ts`). Protocol and state: [references/protocol-and-state.md](references/protocol-and-state.md).

## 1. Platform settings

Development tools often allow local traffic that release builds block. Set these before testing a real build:

| Platform | Setting | Why |
| --- | --- | --- |
| iOS | `NSLocalNetworkUsageDescription` | Shown in the permission prompt; without it, local connections fail |
| iOS | ATS `NSAllowsLocalNetworking: true` | Allows `ws://` / `http://` to local addresses only, not the whole internet |
| iOS | `NSBonjourServices` | Only if you browse with Bonjour/mDNS; list each service type |
| iOS | Multicast networking entitlement | Only for receiving UDP broadcast or multicast; requested from Apple, approval takes days and is not guaranteed |
| Android | Cleartext traffic allowed (for example `usesCleartextTraffic` or a network security config limited to local ranges) | Release builds block unencrypted traffic by default |

Check the framework's current way to set them (config plugins in Expo, `Info.plist` and `AndroidManifest.xml` otherwise).

## 2. Find the server

Prefer, in this order: a QR code or address shown by the server; a subnet scan; Bonjour/mDNS (extra iOS setup); broadcast (needs the entitlement).

The subnet scan in `discovery.ts`:

- Builds the other 253 addresses of the phone's /24
- Probes them in batches (about 24 at a time, about 500 ms each) and accepts a host only when it answers the app's own `ping` command with the expected response. An open port alone could be any device
- Can be cancelled, and stops at the first match
- Takes the phone's IP as a parameter, so the logic is testable without the platform module

Always keep manual address entry as a fallback, and show it when the scan finds nothing.

## 3. Connections

- Save several connections (name + address), remember the last one, and try it automatically at launch
- Show the real state (connecting, online, offline) and disable actions that need a connection while offline
- Detect drops (socket close, missed heartbeat) and offer to reconnect; re-check when the app returns to the foreground

## 4. Protocol

Commands with optional IDs, responses only for commands with an ID, and state pushed by the server on every change. The server is the source of truth: the app may update optimistically, and the next state message overrides it. Keep the message types in one file on each side and change both together.

## 5. Write down the security trade-off

Plain `ws://` without authentication means anyone on the same network who knows the address and port can send commands. That can be acceptable for a home or studio tool when the server only exposes harmless actions, and when it is stated in the documentation. Otherwise add a pairing code shown on the server, and TLS where the server side can support it.

## 6. Test

Unit-test the pure parts (`discovery.test.ts`). Test the rest on real devices on a real network: first connection and the permission prompt, a wrong address, the server stopping, the phone sleeping, airplane mode, and a network without the server.
