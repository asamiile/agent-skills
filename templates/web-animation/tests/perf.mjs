/*
 * Load time and smoothness under throttled conditions (`pnpm test:perf`; nothing passes or fails)
 * - For each network/CPU condition and viewport, measures:
 *   time until the component is ready (--loaded), until it finishes (--complete), bytes transferred,
 *   frame intervals during the animation, and whether a fallback state was used
 * - Results go to the console and test-results/perf.json. Record them in PERF.md with the conditions
 * - Headless Chrome may not use the GPU, so frame times are slower than on real devices.
 *   HEADED=1 pnpm test:perf shows the window and gives numbers closer to GPU rendering
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, VIEWPORTS, openPage, setup } from './lib/browser.mjs';

const PAGE = 'index.html';
const ROOT = '.{prefix}';
/** State classes on the root whose first appearance is timed */
const STATES = ['loaded', 'complete', 'slow', 'static'];
/** Canvas the renderer creates only when WebGL is used (calling getContext here would create a context instead) */
const WEBGL_CANVAS = '.{prefix}__canvas--webgl';
const MBPS = 1024 * 1024 / 8;
// Close to the presets in Chrome DevTools
const CONDITIONS = [
  { name: 'No throttling' },
  { name: 'Network Fast 4G (9 Mbps down, 60 ms)', network: { latency: 60, down: 9 * MBPS, up: 1.5 * MBPS } },
  { name: 'Network Slow 4G (1.6 Mbps down, 150 ms)', network: { latency: 150, down: 1.6 * MBPS, up: 0.75 * MBPS } },
  { name: 'CPU 4× slower', cpu: 4 },
  { name: 'CPU 6× slower', cpu: 6 },
];
const VIEWPORT_NAMES = ['pc-1440', 'sp-375'];

// Runs in the page before any script: records when each state class appears, and every frame interval
const recorder = ([root, block, states]) => {
  const rec = { marks: {}, frames: [] };
  window.__perf = rec;
  const mark = () => {
    const el = document.querySelector(root);
    if (!el) return;
    states.forEach((s) => {
      if (el.classList.contains(`${block}--${s}`) && rec.marks[s] === undefined) rec.marks[s] = performance.now();
    });
  };
  new MutationObserver(mark).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  let last = 0;
  const tick = (now) => {
    if (last) rec.frames.push([now, now - last]);
    last = now;
    const end = rec.marks.complete ?? rec.marks.static;
    if (end === undefined || now - end < 300) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const env = await setup();
const results = [];
try {
  for (const condition of CONDITIONS) {
    for (const vp of VIEWPORT_NAMES) {
      const { context, page } = await openPage(env.browser, `${env.server.url}/${PAGE}`, {
        viewport: VIEWPORTS[vp],
        waitLoad: false,
        beforeGoto: async (p) => {
          await p.addInitScript(recorder, [ROOT, ROOT.slice(1), STATES]);
          const cdp = await p.context().newCDPSession(p);
          if (condition.network) {
            await cdp.send('Network.enable');
            await cdp.send('Network.emulateNetworkConditions', {
              offline: false,
              latency: condition.network.latency,
              downloadThroughput: condition.network.down,
              uploadThroughput: condition.network.up,
            });
          }
          if (condition.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: condition.cpu });
        },
      });
      await page.waitForFunction(() => window.__perf?.marks.complete !== undefined || window.__perf?.marks.static !== undefined, null, { timeout: 60000 });
      await page.waitForTimeout(400);
      const r = await page.evaluate((webglCanvas) => {
        const { marks, frames } = window.__perf;
        const during = frames.filter(([t]) => marks.loaded !== undefined && t >= marks.loaded && t <= (marks.complete ?? Infinity)).map(([, g]) => g);
        const sorted = [...during].sort((a, b) => a - b);
        const bytes = performance.getEntriesByType('resource').reduce((sum, e) => sum + (e.transferSize || e.encodedBodySize || 0), 0);
        return {
          marks,
          bytes,
          frames: during.length,
          medianMs: sorted[Math.floor(sorted.length / 2)] ?? null,
          maxMs: sorted.at(-1) ?? null,
          over20ms: during.filter((g) => g > 20).length,
          webgl: !!document.querySelector(webglCanvas),
        };
      }, WEBGL_CANVAS);
      await context.close();
      const s = (ms) => (ms === undefined ? '-' : `${(ms / 1000).toFixed(2)}s`);
      console.log(`${condition.name} / ${vp}: ready ${s(r.marks.loaded)} · done ${s(r.marks.complete ?? r.marks.static)} · ${(r.bytes / 1024).toFixed(0)} KB · median ${r.medianMs?.toFixed(1)} ms · max ${r.maxMs?.toFixed(1)} ms · >20ms ${r.over20ms}/${r.frames}${r.marks.slow !== undefined ? ' · slow fallback' : ''}${r.marks.static !== undefined ? ' · static' : ''}`);
      results.push({ condition: condition.name, viewport: vp, ...r });
    }
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'perf.json'), `${JSON.stringify(results, null, 2)}\n`);
  console.log(`\nSaved: ${join(OUT, 'perf.json')}`);
} finally {
  await env.close();
}
