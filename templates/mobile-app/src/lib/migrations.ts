// Versioned migrations for key-value storage on the device (AsyncStorage, MMKV, SecureStore wrappers).
// Users update from any old version, possibly skipping several, so each step runs in order exactly once.
// The stored version is written after each step: an interrupted run resumes at the failed step next launch.

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type Migration = { version: number; run: (store: KeyValueStore) => Promise<void> };

export const PREFIX = "{app}."; // namespace every key so a renamed key never collides with an old one
const VERSION_KEY = `${PREFIX}storageVersion`;

/** Runs pending migrations in order. Call once at startup, before anything reads stored data. */
export async function migrate(store: KeyValueStore, migrations: Migration[]): Promise<number> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  let current = Number((await store.getItem(VERSION_KEY)) ?? 0);
  for (const step of sorted) {
    if (step.version <= current) continue;
    await step.run(store);
    current = step.version;
    await store.setItem(VERSION_KEY, String(current));
  }
  return current;
}

/** Example step: one saved address becomes the first entry of a list of saved connections. */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    run: async (store) => {
      const legacy = await store.getItem(`${PREFIX}serverAddress`);
      if (!legacy) return;
      const raw = await store.getItem(`${PREFIX}connections`);
      let list: unknown[] = [];
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = []; // corrupt data must not block startup
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await store.setItem(`${PREFIX}connections`, JSON.stringify([{ id, name: "", address: legacy }, ...list]));
      await store.setItem(`${PREFIX}lastConnectionId`, id);
      await store.removeItem(`${PREFIX}serverAddress`); // last, so a crash before this repeats the step safely
    },
  },
];
