/*
 * Browser tests for an animated component (`pnpm test`)
 * - Keep the cases in sync with the "Automated" section of QA.md
 * - The first run saves baselines. After an intended visual change, run `pnpm test:update`
 * - Run from your own terminal: a sandbox usually cannot start a browser or bind a local port
 * Replace {prefix} with the component's class prefix and adjust the state classes to the project.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { VIEWPORTS, compareScreenshot, openPage, pollOpacity, screenshotPage, settle, setup, toEnd, waitOpacity } from './lib/browser.mjs';

const PAGE = 'index.html';
const ROOT = '.{prefix}';

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env?.close();
});

const withPage = async (options, fn) => {
  const opened = await openPage(env.browser, `${env.server.url}/${PAGE}`, options);
  try {
    await fn(opened);
  } finally {
    await opened.context.close();
  }
};
const noErrors = (errors) => assert.deepEqual(errors, [], 'Errors were reported');
const noOverflow = async (page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `Page overflows horizontally by ${overflow}px`);
};

describe('final state', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    it(`${name}: matches the baseline and does not overflow`, async () => {
      await withPage({ viewport, control: true }, async ({ page, errors }) => {
        await toEnd(page);
        await settle(page);
        await noOverflow(page);
        const diff = await compareScreenshot(env.browser, `final-${name}`, await screenshotPage(page));
        assert.equal(diff, null, diff ? `${diff}${page.srcChanged?.length ? `\nImages changed during capture: ${page.srcChanged.join(', ')}` : ''}` : '');
        noErrors(errors);
      });
    });
  }
});

describe('playback', () => {
  it('plays without errors and stops in the final state', async () => {
    await withPage({}, async ({ page, errors }) => {
      await page.waitForSelector(`${ROOT}.{prefix}--complete`, { timeout: 15000 });
      noErrors(errors);
    });
  });

  it('jumps to the final state when the layout switches breakpoints during playback', async () => {
    await withPage({ viewport: VIEWPORTS['pc-1440'] }, async ({ page, errors }) => {
      await page.waitForSelector(`${ROOT}.{prefix}--loaded`);
      await page.setViewportSize(VIEWPORTS['sp-375']);
      await page.waitForSelector(`${ROOT}.{prefix}--complete`, { timeout: 5000 });
      await noOverflow(page);
      noErrors(errors);
    });
  });
});

describe('fallbacks', () => {
  it('reduced motion: shows the final state at once', async () => {
    await withPage({ reducedMotion: 'reduce' }, async ({ page }) => {
      await page.waitForSelector(`${ROOT}.{prefix}--static`, { timeout: 2000 });
    });
  });

  it('library from the CDN fails: shows the final state at once', async () => {
    await withPage({ block: [/{cdn-host}/] }, async ({ page }) => {
      await page.waitForSelector(`${ROOT}.{prefix}--static`, { timeout: 2000 });
    });
  });

  it('JavaScript disabled: the CSS shows the final state', async () => {
    await withPage({ javaScriptEnabled: false }, async ({ page }) => {
      await pollOpacity(page, `${ROOT}__final`, '1');
    });
  });

  it('main script fails: nothing for a moment, then the CSS safety net shows the final state', async () => {
    await withPage({ block: [/\/{prefix}\.js$/] }, async ({ page }) => {
      assert.equal(await page.$eval(`${ROOT}__final`, (el) => getComputedStyle(el).opacity), '0');
      await waitOpacity(page, `${ROOT}__final`, '1', 6000);
    });
  });

  it('data loads too slowly: gives up and shows the final state', async () => {
    await withPage({ delay: { pattern: /\/data\//, ms: 8000 }, waitLoad: false }, async ({ page }) => {
      await page.waitForSelector(`${ROOT}.{prefix}--static`, { timeout: 8000 });
    });
  });

  it('WebGL 2 unavailable: still completes', async () => {
    await withPage({ noWebGL2: true }, async ({ page, errors }) => {
      await page.waitForSelector(`${ROOT}.{prefix}--complete`, { timeout: 15000 });
      noErrors(errors);
    });
  });
});
