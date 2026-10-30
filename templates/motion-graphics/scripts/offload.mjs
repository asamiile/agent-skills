#!/usr/bin/env node
/*
 * Moves rendered media off the local disk with rclone, keeping the folder layout (Node built-in modules only)
 *
 *   node scripts/offload.mjs <path...>        offload files or folders under OFFLOAD_ROOT
 *   node scripts/offload.mjs --all            everything under OFFLOAD_ROOT
 *   node scripts/offload.mjs --fetch <path>   download videos of a folder back (for re-encoding and so on)
 *   node scripts/offload.mjs --list-remote    print every file on the remote, relative to its root
 *   node scripts/offload.mjs --enabled        exit 0 when offloading is configured
 *
 * Stills are copied (the repository may keep them); videos are moved, but only when ffprobe can read
 * them, and rclone deletes the local copy only after a verified upload. Re-running is safe.
 * Nothing on the remote is ever deleted.
 *
 * Settings (environment or .env in the current folder; the environment wins):
 *   OFFLOAD_REMOTE      rclone "remote:path", or a local folder such as an external disk. Unset: off
 *   OFFLOAD=0           turn it off
 *   OFFLOAD_ROOT        local folder that mirrors the remote (default: out)
 *   OFFLOAD_TRANSFERS   parallel transfers (default 8)
 *   OFFLOAD_CHUNK_SIZE  upload chunk for Google Drive (default 64M; memory ≈ transfers × chunk)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';

const STILLS = /\.(png|jpe?g|webp)$/i;
const VIDEOS = /\.(mp4|mov|webm|mkv)$/i;

const env = (() => {
  const values = {};
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m) values[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2'); // plain KEY=VALUE only; nothing is evaluated
    }
  }
  return { ...values, ...process.env };
})();
const REMOTE = (env.OFFLOAD_REMOTE ?? '').replace(/\/+$/, '');
const ROOT = resolve(env.OFFLOAD_ROOT || 'out');
const TRANSFER_OPTIONS = ['--transfers', env.OFFLOAD_TRANSFERS || '8', '--checkers', '16', '--drive-chunk-size', env.OFFLOAD_CHUNK_SIZE || '64M'];

const rclone = (args, options = {}) => spawnSync('rclone', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options });
const isLocalRemote = /^(\/|~|\.{1,2}\/)/.test(REMOTE);

const enabled = () => {
  if (!REMOTE || env.OFFLOAD === '0') return false;
  const listed = rclone(['listremotes']);
  if (listed.error || listed.status !== 0) return false;
  // A local folder needs no rclone configuration; "name:path" needs a configured remote "name:"
  return isLocalRemote || listed.stdout.split(/\s+/).includes(`${REMOTE.split(':')[0]}:`);
};
const remoteOf = (dir) => (dir ? `${REMOTE}/${dir.split(sep).join('/')}` : REMOTE);
const readable = (file) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name:format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return !r.error && r.status === 0 && r.stdout.trim() !== '';
};
const walk = (path) => (statSync(path).isDirectory() ? readdirSync(path).flatMap((n) => walk(join(path, n))) : [path]);

// One rclone call per folder, with an explicit file list, so only the chosen files move
const transfer = (command, files) => {
  const byDir = new Map();
  for (const file of files) {
    const dir = relative(ROOT, dirname(file));
    byDir.set(dir, [...(byDir.get(dir) ?? []), file.slice(dirname(file).length + 1)]);
  }
  const tmp = mkdtempSync(join(tmpdir(), 'offload-'));
  try {
    for (const [dir, names] of byDir) {
      const list = join(tmp, 'files.txt');
      writeFileSync(list, `${names.join('\n')}\n`);
      rclone([command, join(ROOT, dir), remoteOf(dir), '--files-from-raw', list, ...TRANSFER_OPTIONS, '--retries', '3', '--stats-one-line', '--stats', '30s', '-v'], { stdio: 'inherit' });
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
};

const offload = (paths) => {
  const files = paths.flatMap((p) => walk(resolve(p))).filter((f) => f.startsWith(ROOT + sep));
  const stills = files.filter((f) => STILLS.test(f));
  const videos = [];
  const kept = [];
  for (const f of files.filter((f) => VIDEOS.test(f))) (readable(f) ? videos : kept).push(f);
  transfer('copy', stills);
  transfer('move', videos);
  kept.push(...videos.filter((f) => existsSync(f))); // still here: the upload did not verify
  console.log(`Copied ${stills.length} stills, moved ${videos.length - videos.filter((f) => existsSync(f)).length} videos to ${REMOTE}`);
  if (kept.length) {
    console.log(`Left locally:\n  ${kept.map((f) => relative(ROOT, f)).join('\n  ')}`);
    return 1;
  }
  return 0;
};

const args = process.argv.slice(2);
if (args.includes('--enabled')) process.exit(enabled() ? 0 : 1);
if (!enabled()) {
  console.log('Offloading is off: set OFFLOAD_REMOTE (rclone "remote:path" or a local folder) in .env and make sure rclone is installed.');
  process.exit(1);
}
if (args.includes('--list-remote')) {
  const r = rclone(['lsf', '-R', '--files-only', REMOTE]);
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  process.stdout.write(r.stdout);
  process.exit(0);
}
if (args.includes('--fetch')) {
  for (const p of args.filter((a) => !a.startsWith('--'))) {
    const dir = relative(ROOT, resolve(p));
    rclone(['copy', remoteOf(dir), join(ROOT, dir), '--include', '*.{mp4,mov,webm,mkv}', '-v'], { stdio: 'inherit' });
  }
  process.exit(0);
}
const targets = args.includes('--all') ? [ROOT] : args.filter((a) => !a.startsWith('--'));
if (targets.length === 0) {
  console.error('Usage: node scripts/offload.mjs <path...> | --all | --fetch <path> | --list-remote | --enabled');
  process.exit(2);
}
process.exit(offload(targets));
