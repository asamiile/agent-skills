/*
 * Tuning panel for the mock page. Mock only; never shipped
 * - Receives the component's API through the debug hook instead of letting it autoplay
 * - Every change rebuilds the timeline from the edited values and keeps the playhead position
 * - Values are saved per browser; "Copy values" puts them on the clipboard to paste into DEFAULTS
 * Load order in mock.html: GSAP, lil-gui, player.js, this file, then the component's scripts
 */
type Api = { defaults: Record<string, unknown>; build: (params: Record<string, unknown>) => gsap.core.Timeline };

interface Window {
  __animDebug?: (api: Api) => void;
  lil: { GUI: new (options?: { title?: string }) => LilGui };
}
// Minimal shape of lil-gui used here
type LilGui = {
  add: (obj: object, prop: string, ...args: unknown[]) => { name: (n: string) => LilController; onChange: (f: () => void) => LilController };
  addFolder: (title: string) => LilGui;
  close: () => void;
};
type LilController = { name: (n: string) => LilController; onChange: (f: () => void) => LilController; listen: () => LilController };

(() => {
  const STORAGE_KEY = 'mock:{project}';
  const EASES = ['none', 'power1.out', 'power2.out', 'power3.out', 'power2.inOut', 'sine.inOut', 'expo.out', 'back.out(1.4)', 'elastic.out(1, 0.6)'];

  /*
   * Saved values are applied only for keys that still exist and whose code default has not changed since they were saved.
   * Renamed keys are dropped, and a new default in the code wins over an old saved value.
   */
  const load = (defaults: Record<string, unknown>): Record<string, unknown> => {
    const out = { ...defaults };
    try {
      const { values = {}, base = {} } = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      Object.keys(out).forEach((k) => {
        if (k in values && JSON.stringify(base[k]) === JSON.stringify(defaults[k])) out[k] = values[k];
      });
    } catch {
      // broken saved data: use the defaults
    }
    return out;
  };
  const save = (defaults: Record<string, unknown>, values: Record<string, unknown>): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, base: defaults }));
  };

  window.__animDebug = (api) => {
    const params = load(api.defaults);
    let tl = api.build(params);
    tl.play();

    const rebuild = (): void => {
      const time = tl.time();
      const paused = tl.paused();
      tl.kill();
      tl = api.build(params);
      tl.time(Math.min(time, tl.duration()));
      tl.paused(paused);
      player.refresh();
      save(api.defaults, params);
    };

    const player = window.mockPlayer({
      timeline: () => tl,
      labels: Object.keys(tl.labels),
      onRestart: () => tl.restart(),
    });

    const gui = new window.lil.GUI({ title: '{project} mock' });
    // One folder per phase; same folder names and order on every mock page
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'number') gui.add(params, key, 0, Math.max(1, value * 3), 0.01).name(key).onChange(rebuild);
      else if (typeof value === 'string' && EASES.includes(value)) gui.add(params, key, EASES).name(key).onChange(rebuild);
      else if (typeof value === 'boolean') gui.add(params, key).name(key).onChange(rebuild);
    });
    const actions = {
      copy: async () => {
        await navigator.clipboard.writeText(JSON.stringify(params, null, 2));
        player.notify('Copied');
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        Object.assign(params, api.defaults);
        rebuild();
      },
    };
    gui.add(actions, 'copy').name('Copy values');
    gui.add(actions, 'reset').name('Reset to defaults');
  };
})();
