#!/usr/bin/env node
/*
 * Checks rendered videos against an expected spec with ffprobe (Node built-in modules only)
 *
 *   node scripts/verify-video.mjs [options] <file...>
 *     --duration 5        seconds (±1 frame)       --width 1920 --height 1080
 *     --fps 30            frame rate               --codec h264 | prores | ...
 *     --pix-fmt yuv420p   exact pixel format       --alpha  (ProRes 4444 with an alpha pixel format)
 *     --max-mb 3900       file size limit (for example a stock site's upload limit)
 *
 * Prints one line per file and exits 1 when any file fails, so it can gate a pipeline.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const args = process.argv.slice(2);
const files = [];
const want = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--alpha') want.alpha = true;
  else if (a.startsWith('--')) want[a.slice(2)] = args[++i];
  else files.push(a);
}
if (files.length === 0) {
  console.error('Usage: node scripts/verify-video.mjs [--duration s] [--width px] [--height px] [--fps n] [--codec c] [--pix-fmt f] [--alpha] [--max-mb n] <file...>');
  process.exit(2);
}

const probe = (file) => {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_frames:format=duration',
    '-of', 'json', file,
  ], { encoding: 'utf8' });
  const { streams = [], format = {} } = JSON.parse(out);
  const s = streams[0] ?? {};
  const [num, den] = (s.r_frame_rate ?? '0/1').split('/').map(Number);
  return { ...s, fps: den ? num / den : 0, duration: Number(format.duration ?? 0) };
};

let failed = 0;
for (const file of files) {
  const problems = [];
  let info;
  try {
    info = probe(file);
  } catch (error) {
    console.log(`✖ ${file}: ffprobe could not read it (${error.message.split('\n')[0]})`);
    failed++;
    continue;
  }
  const fps = Number(want.fps ?? info.fps);
  if (want.duration && Math.abs(info.duration - Number(want.duration)) > 1 / fps + 1e-3) problems.push(`duration ${info.duration}s, expected ${want.duration}s`);
  if (want.width && info.width !== Number(want.width)) problems.push(`width ${info.width}, expected ${want.width}`);
  if (want.height && info.height !== Number(want.height)) problems.push(`height ${info.height}, expected ${want.height}`);
  if (want.fps && Math.abs(info.fps - Number(want.fps)) > 0.01) problems.push(`fps ${info.fps.toFixed(3)}, expected ${want.fps}`);
  if (want.codec && info.codec_name !== want.codec) problems.push(`codec ${info.codec_name}, expected ${want.codec}`);
  if (want['pix-fmt'] && info.pix_fmt !== want['pix-fmt']) problems.push(`pix_fmt ${info.pix_fmt}, expected ${want['pix-fmt']}`);
  if (want.alpha) {
    if (info.codec_name !== 'prores' || !/4444/.test(info.profile ?? '')) problems.push(`not ProRes 4444 (${info.codec_name} ${info.profile ?? ''})`);
    if (!/^yuva|^rgba|^argb|^bgra/.test(info.pix_fmt ?? '')) problems.push(`pix_fmt ${info.pix_fmt} has no alpha`);
  }
  const mb = statSync(file).size / 1e6;
  if (want['max-mb'] && mb > Number(want['max-mb'])) problems.push(`${mb.toFixed(0)} MB, limit ${want['max-mb']} MB`);

  const summary = `${info.codec_name}${info.profile ? ` (${info.profile})` : ''} ${info.width}×${info.height} ${info.fps.toFixed(2)}fps ${info.duration.toFixed(3)}s ${info.pix_fmt} ${mb.toFixed(1)}MB`;
  if (problems.length) {
    failed++;
    console.log(`✖ ${file}: ${summary}\n    ${problems.join('\n    ')}`);
  } else {
    console.log(`✔ ${file}: ${summary}`);
  }
}
process.exit(failed ? 1 : 0);
