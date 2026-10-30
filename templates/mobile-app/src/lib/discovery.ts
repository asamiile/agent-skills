// Finds a companion server on the phone's local network by scanning its /24 subnet.
// A host counts only when it answers an application-level "ping": an open port alone could be any device.
// Pure parts (candidate list, batching) have no React Native imports, so they run in plain unit tests.

export type DiscoveryOptions = {
  port: number;
  concurrency?: number; // sockets open at once; phones and routers struggle above a few dozen
  timeoutMs?: number; // per host; LAN round trips are a few ms, so keep this short
  signal?: AbortSignal; // cancel when the user leaves the screen
};

const PING_ID = "discover";

/** Every host address on myIp's /24 except myIp itself. Assumes a 255.255.255.0 home network. */
export function scanCandidates(myIp: string): string[] {
  const parts = myIp.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return [];
  const base = parts.slice(0, 3).join(".");
  const candidates: string[] = [];
  for (let i = 1; i <= 254; i++) if (String(i) !== String(Number(parts[3]))) candidates.push(`${base}.${i}`);
  return candidates;
}

/** Opens a WebSocket, sends a ping command, and resolves true only for the expected response. */
export function probe(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const socket = new WebSocket(`ws://${ip}:${port}`);
    const finish = (found: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // already closed
      }
      resolve(found);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    socket.onopen = () => socket.send(JSON.stringify({ type: "command", action: "ping", id: PING_ID }));
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data?.type === "response" && data?.id === PING_ID && data?.ok === true) finish(true);
      } catch {
        // some other service answered; ignore it
      }
    };
    socket.onerror = () => finish(false);
    socket.onclose = () => finish(false);
  });
}

/** Returns the first host that answers, or null. `myIp` comes from the platform (for example expo-network). */
export async function discover(myIp: string, options: DiscoveryOptions): Promise<string | null> {
  const { port, concurrency = 24, timeoutMs = 500, signal } = options;
  const candidates = scanCandidates(myIp);
  for (let i = 0; i < candidates.length; i += concurrency) {
    if (signal?.aborted) return null;
    const batch = candidates.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(async (ip) => ((await probe(ip, port, timeoutMs)) ? ip : null)));
    const found = results.find((ip): ip is string => ip !== null);
    if (found) return found;
  }
  return null;
}
