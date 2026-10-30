/*
 * Frame capture of a GSAP animation on a live site (`pnpm site:frames <URL>`)
 * - Pauses GSAP's global timeline before the page's scripts start it, finds the component's timeline,
 *   and steps it 1/60 s at a time, capturing the viewport each time. Same frames on every run, no drops
 * - Output: {out}/pc/ and {out}/sp/ (0000.jpg = 0 s, plus frames.json). Keep the folder out of git
 * - Basic authentication: SITE_USER and SITE_PASS environment variables. They are passed to the browser for
 *   the given origin only, and never written to disk or printed
 *     read -s "SITE_PASS?Password: " && export SITE_PASS
 *     SITE_USER=name pnpm site:frames https://example.com/
 * - SITE_TARGETS=pc captures only PC (comma-separated: pc, sp)
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const FPS = 60;
const OUT = 'test-results/site-frames';
/** A state class the component adds when it is ready to play */
const READY_SELECTOR = '.{prefix}.{prefix}--loaded';
/** Labels that identify the component's timeline among all GSAP timelines */
const LABELS = ['{first-label}', '{last-label}'];
const TARGETS = {
  pc: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  sp: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Usage: pnpm site:frames https://... (a page that contains the component)');
  process.exit(1);
}
const { SITE_USER: username, SITE_PASS: password } = process.env;
const httpCredentials = username && password ? { username, password, origin: new URL(url).origin } : undefined;
const names = (process.env.SITE_TARGETS ?? 'pc,sp').split(',').map((s) => s.trim()).filter((s) => s in TARGETS);

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
try {
  for (const name of names) {
    const context = await browser.newContext({ ...TARGETS[name], httpCredentials, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    // Timelines are still created, but nothing advances
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => window.gsap?.globalTimeline.pause());
    });
    const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    if (response?.status() === 401) throw new Error('Basic authentication failed (check SITE_USER and SITE_PASS)');
    await page.waitForSelector(READY_SELECTOR, { timeout: 30000 });
    await page.waitForTimeout(800); // CSS transitions run on their own clock; let a fade-in finish

    const duration = await page.evaluate((labels) => {
      const tl = window.gsap.globalTimeline.getChildren(false, false, true).find((t) => labels.every((l) => l in t.labels));
      if (!tl) throw new Error('The component timeline was not found');
      window.__siteTimeline = tl;
      return tl.duration();
    }, LABELS);

    const dir = join(OUT, name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const count = Math.ceil(duration * FPS) + 1;
    for (let i = 0; i < count; i++) {
      await page.evaluate((t) => new Promise((resolve) => {
        window.__siteTimeline.time(t);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }), Math.min(i / FPS, duration));
      await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 85 });
    }
    writeFileSync(join(dir, 'frames.json'), JSON.stringify({ fps: FPS, count, width: TARGETS[name].viewport.width }));
    console.log(`${name}: ${count} frames (${duration.toFixed(2)} s) → ${dir}`);
    await context.close();
  }
} finally {
  await browser.close();
}
