/*
 * Shared helpers for browser tests of an animated page
 * - Uses the Google Chrome installed on the machine through playwright-core (no browser download)
 * - Screenshots are compared pixel by pixel against a baseline, inside the browser's canvas (no image library)
 * - The page under test exposes its timeline through a debug hook (see openPage's `control` option):
 *     if (window.__animDebug) window.__animDebug({ defaults, build }); else build(defaults).play();
 *   build(params) returns a paused timeline with duration(), seek(seconds), and progress(0..1)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../../scripts/serve.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Folder to serve. TEST_ROOT=dist runs the same tests against the deliverable */
export const SERVE_DIR = join(ROOT, process.env.TEST_ROOT === 'dist' ? 'dist' : 'public');
export const OUT = join(ROOT, 'test-results');
const BASELINE = join(OUT, 'baseline');
const ACTUAL = join(OUT, 'actual');
const DIFF = join(OUT, 'diff');

/** TEST_UPDATE=1 rewrites the baselines (after an intended visual change) */
const UPDATE = process.env.TEST_UPDATE === '1';
/** Fail when more than this share of pixels differ */
const MAX_DIFF_RATIO = 0.002;
/** Channel differences up to this value (0-255) count as equal */
const COLOR_TOLERANCE = 16;

/** Viewports to test: both sides of every breakpoint, plus the design's base widths */
export const VIEWPORTS = {
  'pc-1920': { width: 1920, height: 1080 },
  'pc-1440': { width: 1440, height: 900 },
  'tab-768': { width: 768, height: 1024 },
  'sp-767': { width: 767, height: 1024 },
  'sp-375': { width: 375, height: 812 },
};

/** Scripts that only the mock page uses (tuning panel and so on); blocked so the page autoplays as in production */
const MOCK_SCRIPTS = [/\/mock\//, /\/lil-gui@/];
/** Requests the browser makes on its own; a 404 for them is not the page's fault */
const IGNORED = [/\/favicon\.ico$/];

/** Starts the static server and Chrome. HEADED=1 shows the window (closer to real GPU behavior) */
export const setup = async () => {
  const server = await startServer(SERVE_DIR);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', timeout: 30000, headless: process.env.HEADED !== '1' });
  } catch (error) {
    await server.close();
    throw new Error(`Could not start Google Chrome. Is it installed?\n${error}`, { cause: error });
  }
  return {
    server,
    browser,
    close: async () => {
      await browser.close();
      await server.close();
    },
  };
};

/**
 * Opens a page and collects errors
 * @param {import('playwright-core').Browser} browser
 * @param {string} url
 * @param {object} [options]
 * @param {{ width: number, height: number }} [options.viewport]
 * @param {boolean} [options.control] Take the timeline through the debug hook instead of autoplay (window.__animTest)
 * @param {'reduce' | 'no-preference'} [options.reducedMotion]
 * @param {boolean} [options.javaScriptEnabled]
 * @param {RegExp[]} [options.block] Requests to abort (to reproduce a CDN or script that fails to load)
 * @param {{ pattern: RegExp, ms: number }} [options.delay] Requests to delay (to reproduce slow data)
 * @param {string[]} [options.removeGlobals] Globals to delete before the page runs (e.g. 'IntersectionObserver')
 * @param {boolean} [options.noWebGL2] Make getContext('webgl2') return null
 * @param {number} [options.scale] deviceScaleFactor
 * @param {boolean} [options.waitLoad] false: return without waiting for the load event
 * @param {(page: import('playwright-core').Page) => Promise<void>} [options.beforeGoto] Extra setup (throttling and so on)
 */
export const openPage = async (browser, url, options = {}) => {
  const {
    viewport = VIEWPORTS['pc-1440'], control = false, reducedMotion = 'no-preference', javaScriptEnabled = true,
    block = [], delay, removeGlobals = [], noWebGL2 = false, scale = 1, waitLoad = true, beforeGoto,
  } = options;

  const context = await browser.newContext({ viewport, reducedMotion, javaScriptEnabled, deviceScaleFactor: scale });
  const page = await context.newPage();

  const blocked = [...MOCK_SCRIPTS, ...block];
  const isBlocked = (target) => blocked.some((re) => re.test(target));
  const isIgnored = (target) => isBlocked(target) || IGNORED.some((re) => re.test(target));
  const errors = [];
  const aborted = [];
  page.on('pageerror', (error) => errors.push(`Script error: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnored(msg.location().url)) errors.push(`Console error: ${msg.text()}`);
  });
  page.on('requestfailed', (req) => {
    if (isBlocked(req.url())) return;
    // Chrome may preload an image before the viewport is known and cancel it when <picture>/srcset picks another.
    // Real devices know their width up front, so a canceled image is a test artifact, not a failure. 404s are counted below.
    if (req.resourceType() === 'image' && req.failure()?.errorText === 'net::ERR_ABORTED') {
      aborted.push(req.url().replace(/^https?:\/\/[^/]+/, ''));
      return;
    }
    errors.push(`Failed to load: ${req.url()} (${req.failure()?.errorText})`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !isIgnored(res.url())) errors.push(`Failed to load: ${res.url()} (${res.status()})`);
  });

  await page.route((target) => isBlocked(target.href), (route) => route.abort());
  if (delay) {
    await page.route(delay.pattern, async (route) => {
      await new Promise((r) => setTimeout(r, delay.ms));
      await route.continue().catch(() => undefined); // the test may have closed the page meanwhile
    });
  }
  if (removeGlobals.length) {
    await page.addInitScript((names) => names.forEach((n) => delete window[n]), removeGlobals);
  }
  if (noWebGL2) {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        return type === 'webgl2' ? null : original.call(this, type, ...args);
      };
    });
  }
  if (control) {
    await page.addInitScript(() => {
      window.__animDebug = (api) => {
        const params = { ...api.defaults };
        window.__animTest = { timeline: api.build(params), params };
      };
    });
  }

  if (beforeGoto) await beforeGoto(page);
  await page.goto(url, { waitUntil: waitLoad ? 'load' : 'commit' });
  if (control) await page.waitForFunction(() => window.__animTest, null, { timeout: 10000 });
  page.abortedImages = aborted;
  return { context, page, errors };
};

/** Moves the timeline to its end (pages opened with control: true) */
export const toEnd = (page) => page.evaluate(() => window.__animTest.timeline.progress(1));

/**
 * Seeks the timeline and waits until the frame is painted
 * Two animation frames: canvas renderers often draw on the next frame after the timeline updates
 */
export const seekAndPaint = (page, seconds) => page.evaluate((t) => new Promise((resolve) => {
  window.__animTest.timeline.seek(t);
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}), seconds);

/** Waits until every matching element has the given computed opacity */
export const waitOpacity = (page, selector, opacity, timeout = 10000) => page.waitForFunction(
  ([s, o]) => {
    const els = Array.from(document.querySelectorAll(s));
    return els.length > 0 && els.every((el) => getComputedStyle(el).opacity === o);
  },
  [selector, opacity],
  { timeout },
);

/**
 * Same as waitOpacity, but polls from Node
 * waitForFunction runs inside the page, so it never resolves when JavaScript is disabled
 */
export const pollOpacity = async (page, selector, opacity, timeout = 10000, interval = 200) => {
  const end = Date.now() + timeout;
  for (;;) {
    const values = await page.$$eval(selector, (els) => els.map((el) => getComputedStyle(el).opacity));
    if (values.length > 0 && values.every((v) => v === opacity)) return;
    if (Date.now() > end) throw new Error(`${selector} did not reach opacity ${opacity} (${values.join(', ')})`);
    await new Promise((r) => setTimeout(r, interval));
  }
};

/**
 * Waits until the screen is stable: visible images loaded and decoded, fonts ready, two frames painted
 * Images with decoding="async" can finish loading before they are painted, so decode() is awaited too.
 * Hidden and offscreen lazy images are skipped because they never load.
 */
export const settle = async (page) => {
  await page.evaluate(() => {
    window.__visibleImages = () => Array.from(document.images).filter((img) => {
      const r = img.getBoundingClientRect();
      return img.getClientRects().length > 0 && r.bottom > 0 && r.top < window.innerHeight;
    });
  });
  try {
    await page.waitForFunction(() => window.__visibleImages().every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 8000 });
  } catch {
    const states = await page.evaluate(() => window.__visibleImages()
      .filter((img) => !(img.complete && img.naturalWidth > 0))
      .map((img) => `${img.className}: complete=${img.complete} naturalWidth=${img.naturalWidth} currentSrc=${img.currentSrc}`));
    throw new Error(`Images are not shown\n${states.join('\n')}\nCanceled loads: ${(page.abortedImages ?? []).join(', ') || 'none'}`);
  }
  const done = await page.evaluate(async () => {
    const limit = new Promise((r) => setTimeout(() => r(false), 8000));
    const ready = (async () => {
      await document.fonts.ready;
      await Promise.all(window.__visibleImages().map((img) => img.decode().catch(() => undefined)));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return true;
    })();
    return Promise.race([ready, limit]);
  });
  if (!done) console.warn('Fonts, images, or painting did not settle within 8 s; continuing');
  // Leave time for short CSS transitions (such as a fade-in when the component is ready)
  await page.waitForTimeout(600);
};

/**
 * Screenshot of the whole page
 * page.screenshot({ fullPage: true }) enlarges the viewport while capturing, which can make srcset pick another image
 * and capture it blank. Resize the viewport to the page height first, then take a normal screenshot.
 * Images whose currentSrc changed during the capture are listed in page.srcChanged.
 */
export const screenshotPage = async (page) => {
  const viewport = page.viewportSize();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: viewport.width, height });
  await settle(page);
  const srcs = () => page.evaluate(() => Array.from(document.images).map((img) => img.currentSrc));
  const before = await srcs();
  const png = await page.screenshot();
  const after = await srcs();
  page.srcChanged = before.filter((src, i) => src !== after[i]).map((src, i) => `${src} → ${after[i]}`);
  await page.setViewportSize(viewport);
  return png;
};

/**
 * Compares a screenshot with its baseline
 * - Without a baseline (first run), saves this one as the baseline
 * - Baselines are per OS, because text rendering differs between macOS and Windows
 * - A pixel counts as equal when its color falls within the color range of the other image's 3×3 neighborhood.
 *   This absorbs antialiasing jitter on edges of scaled images, while a 2px shift still fails
 * @returns {Promise<string | null>} A description of the difference, or null
 */
export const compareScreenshot = async (browser, name, png) => {
  const file = `${name}-${process.platform}.png`;
  [BASELINE, ACTUAL, DIFF].forEach((dir) => mkdirSync(dir, { recursive: true }));
  writeFileSync(join(ACTUAL, file), png);
  const baseFile = join(BASELINE, file);
  if (UPDATE || !existsSync(baseFile)) {
    writeFileSync(baseFile, png);
    return null;
  }

  const page = await browser.newPage();
  try {
    const result = await page.evaluate(async ({ a, b, tolerance }) => {
      const load = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/png;base64,${src}`;
      });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { size: `${ia.width}×${ia.height} → ${ib.width}×${ib.height}` };
      const { width, height } = ia;
      const pixels = (img) => {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, width, height).data;
      };
      const pa = pixels(ia);
      const pb = pixels(ib);
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const octx = out.getContext('2d');
      const diff = octx.createImageData(width, height);
      const channelDelta = (i) => Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      const inNeighborhood = (src, x, y, val, offset) => {
        for (let k = 0; k < 3; k++) {
          let min = 255;
          let max = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              const c = src[(ny * width + nx) * 4 + k];
              if (c < min) min = c;
              if (c > max) max = c;
            }
          }
          const v = val[offset + k];
          if (v < min - tolerance || v > max + tolerance) return false;
        }
        return true;
      };
      let count = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const p = i / 4;
        const x = p % width;
        const y = Math.floor(p / width);
        const differs = channelDelta(i) > tolerance && !inNeighborhood(pa, x, y, pb, i) && !inNeighborhood(pb, x, y, pa, i);
        if (differs) {
          count++;
          diff.data.set([255, 0, 0, 255], i);
        } else {
          const g = 255 - (255 - pb[i + 1]) * 0.25; // unchanged pixels are shown faded
          diff.data.set([g, g, g, 255], i);
        }
      }
      octx.putImageData(diff, 0, 0);
      return { ratio: count / (width * height), diff: out.toDataURL('image/png').split(',')[1] };
    }, { a: readFileSync(baseFile).toString('base64'), b: png.toString('base64'), tolerance: COLOR_TOLERANCE });

    if (result.size) return `Image size changed (${result.size})`;
    if (result.ratio > MAX_DIFF_RATIO) {
      writeFileSync(join(DIFF, file), Buffer.from(result.diff, 'base64'));
      return `${(result.ratio * 100).toFixed(2)}% of pixels differ (test-results/diff/${file})`;
    }
    return null;
  } finally {
    await page.close();
  }
};
