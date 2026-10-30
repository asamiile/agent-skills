/*
 * Builds the WordPress embed deliverable (`pnpm package`)
 *
 *   public/index.html             → dist/index.html  (standalone preview page; the client can open it on its own)
 *   (generated from index.html)   → dist/embed.html  (snippet for the theme, split by where each part goes)
 *   public/assets/**              → dist/{bundle}/** (only the files that are referenced)
 *   public/preview_assets/**      → dist/preview_assets/** (preview-page-only files; not part of embed.html)
 *   delivery/*.md                 → dist/*.md        (documents for the client and the theme developer)
 *   dist/                         → release/{bundle}_YYYYMMDD.zip
 *
 * Only files reachable from index.html (src, href, srcset, CSS url(), preload links) are copied,
 * so leftover assets and mock files never reach the deliverable.
 * Paths that start with assets/ are rewritten to {bundle}/ so the theme can drop the folder in as is.
 * Node built-in modules only.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeZip } from './zip.mjs';

// ---- Project settings ----
/** Folder name the theme receives. Use a name that does not clash with the theme's own assets/ */
const BUNDLE = '{bundle}';
/** Root element of the embedded component (must appear in index.html) */
const ROOT_SELECTOR = '<section class="{prefix}';
/** Files the embed cannot work without (paths relative to public/) */
const REQUIRED = ['assets/css/{prefix}.css', 'assets/js/{prefix}.js'];
/** Folder for files used only by the preview page. Scripts from here are left out of embed.html */
const PREVIEW_ONLY = 'preview_assets/';
/** Documents shipped with the deliverable (delivery/ → dist/) */
const DOCS = ['README.md'];
/** Things that must never ship */
const FORBIDDEN_FILES = [/\.ts$/, /(^|\/)mock([/._-])/, /(^|\/)types\//, /\.map$/, /\.DS_Store$/];
/** Markup that must never ship (debug hooks, tuning UI) */
const FORBIDDEN_MARKUP = /mock|lil-gui|__debug/;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');
const DELIVERY = join(ROOT, 'delivery');

const errors = [];
const fail = (msg) => errors.push(msg);

const toDist = (path) => (path.startsWith('assets/') ? `${BUNDLE}/${path.slice('assets/'.length)}` : path);
const rewritePaths = (source) => source.replace(/(["\s,(])assets\//g, `$1${BUNDLE}/`);
/** External URLs, data URLs, and in-page links are skipped */
const isLocal = (url) => !/^(?:[a-z]+:|\/\/|#|data:)/i.test(url);

// ---- 1. Start from an empty dist/ ----
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// ---- 2. Copy everything index.html references ----
const copied = new Set();
const copy = (path) => {
  path = path.split(/[?#]/)[0];
  if (copied.has(path)) return;
  copied.add(path);
  const from = join(SRC, path);
  if (!existsSync(from)) {
    fail(`Referenced file is missing: public/${path}`);
    return;
  }
  const to = join(DIST, toDist(path));
  mkdirSync(dirname(to), { recursive: true });
  // CSS keeps relative url() paths, so the folder layout inside {bundle}/ must stay the same
  cpSync(from, to);
  if (extname(path) === '.css') {
    for (const [, , url] of readFileSync(from, 'utf8').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
      if (isLocal(url)) copy(posix.normalize(posix.join(posix.dirname(path), url)));
    }
  }
};

const html = existsSync(join(SRC, 'index.html')) ? readFileSync(join(SRC, 'index.html'), 'utf8') : '';
if (!html.trim()) {
  fail('index.html is empty');
} else {
  writeFileSync(join(DIST, 'index.html'), rewritePaths(html));
  if (!html.includes(ROOT_SELECTOR)) fail(`index.html has no root element (${ROOT_SELECTOR}...)`);
  REQUIRED.forEach((path) => {
    if (!html.includes(path)) fail(`index.html does not load ${path}`);
  });
  if (FORBIDDEN_MARKUP.test(html)) fail('index.html contains mock or debug markup');
}

// Files fetched by JavaScript (JSON, binary data) are found through <link rel="preload"> in the HTML
for (const [, , url] of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
  if (isLocal(url)) copy(url);
}
for (const [, list] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
  list.split(',').map((item) => item.trim().split(/\s+/)[0]).filter(isLocal).forEach(copy);
}

// ---- 3. Generate embed.html: what goes in <head>, where the component goes, and before </body> ----
const dedent = (text) => {
  const lines = text.split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
};
const makeEmbed = (source) => {
  const head = source.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
  // Only the component's own stylesheet and the connection hints; page-level styles stay in the preview page
  const headLines = head.split('\n').map((l) => l.trim())
    .filter((l) => l.includes(`${BUNDLE}/css/`) || /rel="(?:preconnect|preload)"/.test(l));
  const escaped = ROOT_SELECTOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = ROOT_SELECTOR.match(/^<(\w+)/)[1];
  const markup = source.match(new RegExp(`^[ \\t]*${escaped}[\\s\\S]*?<\\/${tag}>`, 'm'))?.[0];
  const body = source.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';
  const scripts = (body.match(/^[ \t]*<script[\s\S]*?<\/script>/gm) ?? [])
    .filter((s) => !s.includes(PREVIEW_ONLY)).map(dedent);
  if (!markup) throw new Error('the root element was not found');
  if (scripts.length === 0) throw new Error('no <script> in <body>');
  return [
    '<!-- Put inside <head> -->',
    ...headLines,
    '',
    '<!-- Put where the component should appear -->',
    dedent(markup),
    '',
    '<!-- Put right before </body>, in this order -->',
    ...scripts,
    '',
  ].join('\n');
};
if (html.trim()) {
  try {
    const embed = makeEmbed(rewritePaths(html));
    writeFileSync(join(DIST, 'embed.html'), embed);
    REQUIRED.map(toDist).forEach((path) => {
      if (!embed.includes(path)) fail(`embed.html does not include ${path}`);
    });
  } catch (error) {
    fail(`Cannot generate embed.html: ${error.message}`);
  }
}

// ---- 4. Documents ----
for (const name of DOCS) {
  const from = join(DELIVERY, name);
  if (!existsSync(from)) fail(`Document is missing: delivery/${name}`);
  else if (!readFileSync(from, 'utf8').trim()) fail(`Document is empty: delivery/${name}`);
  else cpSync(from, join(DIST, name));
}

// ---- 5. Check what ended up in dist/ ----
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [relative(DIST, full).split('\\').join('/')];
});
const files = walk(DIST).sort();
files.filter((f) => FORBIDDEN_FILES.some((re) => re.test(f))).forEach((f) => fail(`File must not ship: ${f}`));

if (errors.length) {
  console.error('\n✖ Packaging failed');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const kb = (f) => `${(statSync(join(DIST, f)).size / 1024).toFixed(1)} KB`;
console.log('\n✔ Wrote the deliverable to dist/');
files.forEach((f) => console.log(`  ${f.padEnd(48)} ${kb(f)}`));

// ---- 6. Zip (release/ is not tracked by git) ----
const now = new Date();
const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const zipName = `${BUNDLE}_${stamp}`;
const RELEASE = join(ROOT, 'release');
mkdirSync(RELEASE, { recursive: true });
const zipPath = join(RELEASE, `${zipName}.zip`);
writeZip(zipPath, files.map((f) => ({ name: `${zipName}/${f}`, file: join(DIST, f) })));
console.log(`\n✔ Zipped: release/${zipName}.zip (${(statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB)`);
