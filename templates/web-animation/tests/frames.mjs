/*
 * Contact sheet of the animation (`pnpm test:frames`)
 * - Pauses the timeline, captures the component at fixed intervals, and writes test-results/frames/index.html
 * - For comparing motion by eye; nothing passes or fails
 * - FRAME_STEP=0.1 pnpm test:frames changes the interval (seconds)
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, VIEWPORTS, openPage, seekAndPaint, settle, setup } from './lib/browser.mjs';

const PAGE = 'index.html';
/** Element to capture (the animated area) */
const TARGET = '.{prefix}';
const STEP = Number(process.env.FRAME_STEP) || 0.25;
const VIEWPORT_NAMES = ['pc-1440', 'sp-375'];
const DIR = join(OUT, 'frames');

const env = await setup();
const sections = [];
try {
  rmSync(DIR, { recursive: true, force: true });
  for (const vp of VIEWPORT_NAMES) {
    const { context, page } = await openPage(env.browser, `${env.server.url}/${PAGE}`, { viewport: VIEWPORTS[vp], control: true });
    await seekAndPaint(page, 0);
    await settle(page);
    const duration = await page.evaluate(() => window.__animTest.timeline.duration());
    const target = await page.$(TARGET);
    mkdirSync(join(DIR, vp), { recursive: true });
    const times = [];
    for (let t = 0; t < duration; t += STEP) times.push(t);
    times.push(duration); // always include the last frame
    const frames = [];
    for (const time of times) {
      await seekAndPaint(page, time);
      const label = time.toFixed(2);
      await target.screenshot({ path: join(DIR, vp, `${label}.png`) });
      frames.push(label);
    }
    await context.close();
    sections.push({ vp, duration, frames });
    console.log(`${vp}: ${frames.length} frames (${duration.toFixed(2)} s)`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Frames</title>
<style>
  body { margin: 16px; font: 13px/1.5 sans-serif; color: #333; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr)); gap: 12px; margin-bottom: 32px; }
  figure { margin: 0; }
  img { display: block; width: 100%; border: 1px solid #ddd; }
  figcaption { font-family: ui-monospace, monospace; }
</style>
</head>
<body>
<h1>Frames (${PAGE}, every ${STEP} s)</h1>
${sections.map(({ vp, duration, frames }) => `<h2>${vp} (${duration.toFixed(2)} s)</h2>
<div class="grid" style="--min: ${vp.startsWith('sp') ? 160 : 320}px">
${frames.map((f) => `<figure><img src="${vp}/${f}.png" alt="" loading="lazy"><figcaption>${f}s</figcaption></figure>`).join('\n')}
</div>`).join('\n')}
</body>
</html>
`;
  writeFileSync(join(DIR, 'index.html'), html);
  console.log(`Contact sheet: ${join(DIR, 'index.html')}`);
} finally {
  await env.close();
}
