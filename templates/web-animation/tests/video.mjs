/*
 * Video of the animation (`pnpm video`)
 * - Pauses the timeline, steps it 1/60 s at a time, captures every frame, and joins them into MP4 with ffmpeg
 *   The result is smooth no matter how fast the machine is, because nothing is recorded in real time
 * - Output: test-results/video/{name}.mp4
 * - VIDEO_SCALE=2 pnpm video renders at twice the resolution (for high-density screens; larger files)
 * - Needs ffmpeg. Set FFMPEG=/path/to/ffmpeg if it is not on PATH. Without it, the frames are kept as PNG
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, openPage, seekAndPaint, settle, setup } from './lib/browser.mjs';

const PAGE = 'index.html';
const FPS = 60;
/** Seconds to hold the final state at the end */
const HOLD_SEC = 1;
const SCALE = Number(process.env.VIDEO_SCALE) || 1;
const TARGETS = [
  { name: 'sp-375', viewport: { width: 375, height: 667 } },
  { name: 'pc-1440', viewport: { width: 1440, height: 900 } },
];
const DIR = join(OUT, 'video');

// Fail instead of hanging forever when a frame never paints
const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} did not finish in ${ms / 1000} s`)), ms)),
]);

const ffmpeg = [process.env.FFMPEG, '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']
  .find((cmd) => cmd && existsSync(cmd)) ?? 'ffmpeg';

const env = await setup();
try {
  mkdirSync(DIR, { recursive: true });
  for (const target of TARGETS) {
    const { context, page } = await openPage(env.browser, `${env.server.url}/${PAGE}`, { viewport: target.viewport, control: true, scale: SCALE });
    await seekAndPaint(page, 0);
    await settle(page);
    const duration = await page.evaluate(() => window.__animTest.timeline.duration());
    const total = Math.ceil((duration + HOLD_SEC) * FPS);
    const frames = join(DIR, `${target.name}-frames`);
    rmSync(frames, { recursive: true, force: true });
    mkdirSync(frames, { recursive: true });

    for (let i = 0; i <= total; i++) {
      await withTimeout(seekAndPaint(page, Math.min(i / FPS, duration)), 10000, `Frame ${i}`);
      writeFileSync(join(frames, `${String(i).padStart(5, '0')}.png`), await page.screenshot());
      if (i % FPS === 0) process.stdout.write(`\r${target.name}: ${i} / ${total} frames`);
    }
    await context.close();
    console.log(`\r${target.name}: captured ${total + 1} frames`);

    const out = join(DIR, `${target.name}.mp4`);
    const result = spawnSync(ffmpeg, [
      '-y', '-loglevel', 'error',
      '-framerate', String(FPS),
      '-i', join(frames, '%05d.png'),
      // H.264 with yuv420p needs even width and height; pad odd sizes by one pixel
      '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:white',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
      out,
    ], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`ffmpeg failed or was not found. Frames kept in ${frames}`);
      continue;
    }
    rmSync(frames, { recursive: true, force: true });
    console.log(`Video: ${out}`);
  }
} finally {
  await env.close();
}
