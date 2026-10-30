#!/usr/bin/env node
/*
 * Coarse screening for flashing in a video (Node built-in modules + ffmpeg)
 *
 *   node scripts/flash-check.mjs <video> [--threshold 0.1] [--max-per-second 3]
 *
 * Reads the average luma of every frame (ffmpeg signalstats) and counts flashes: a pair of opposing
 * luminance changes, each at least `threshold` of full scale. Reports every one-second window with more
 * than `max-per-second` flashes. This is a screening aid, not a certified analysis: it uses the whole-frame
 * average (a small area flashing hard can pass, a large area flashing softly can trip it) and it does not
 * check saturated red flashes separately. Use a dedicated analyzer for broadcast or legal compliance.
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^[\d.]+$/.test(a));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const THRESHOLD = opt('threshold', 0.1);
const MAX_PER_SECOND = opt('max-per-second', 3);
if (!file) {
  console.error('Usage: node scripts/flash-check.mjs <video> [--threshold 0.1] [--max-per-second 3]');
  process.exit(2);
}

const rate = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim();
const [num, den] = rate.split('/').map(Number);
const fps = num / (den || 1);

const log = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], {
  encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
});
// YAVG is on a 0-255 scale for 8-bit video; normalize by the largest plausible value
const luma = [...log.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const scale = Math.max(255, ...luma);
const y = luma.map((v) => v / scale);

// Zigzag: a transition is a move of at least THRESHOLD away from the last extreme, against the current
// direction. Two opposing transitions make one flash. Slow drifts and small flicker are ignored
const transitions = [];
let extreme = y[0];
let dir = 0; // 1 rising, -1 falling, 0 not decided yet
for (let i = 1; i < y.length; i++) {
  const v = y[i];
  if (dir === 1 && v > extreme) extreme = v;
  else if (dir === -1 && v < extreme) extreme = v;
  if (dir !== 1 && v - extreme >= THRESHOLD) {
    transitions.push(i);
    dir = 1;
    extreme = v;
  } else if (dir !== -1 && extreme - v >= THRESHOLD) {
    transitions.push(i);
    dir = -1;
    extreme = v;
  }
}

const window = Math.round(fps);
const hits = [];
for (let start = 0; start + 1 < transitions.length; start++) {
  const end = transitions.findIndex((t) => t >= transitions[start] + window);
  const inWindow = (end === -1 ? transitions.length : end) - start;
  const flashes = Math.floor(inWindow / 2);
  if (flashes > MAX_PER_SECOND) hits.push({ at: transitions[start] / fps, flashes });
}

console.log(`${file}: ${y.length} frames at ${fps.toFixed(2)} fps, ${Math.floor(transitions.length / 2)} flashes in total`);
if (hits.length === 0) {
  console.log(`✔ No one-second window with more than ${MAX_PER_SECOND} flashes (threshold ${THRESHOLD})`);
  process.exit(0);
}
const shown = hits.filter((h, i) => i === 0 || h.at - hits[i - 1].at >= 1);
shown.slice(0, 20).forEach((h) => console.log(`✖ ${h.at.toFixed(2)}s: ${h.flashes} flashes within one second`));
process.exit(1);
