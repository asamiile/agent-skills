/*
 * Static file server with Node built-in modules only
 *
 * As a module (automated tests):
 *   const server = await startServer(root);            // 127.0.0.1, a free port, Cache-Control: no-store
 *   ... server.url ...; await server.close();
 *
 * As a command (preview without live reload):
 *   node scripts/serve.mjs [folder] [--port 3001]       // default folder: public
 *   Use it to check the browser's back/forward cache (bfcache): a live-reload WebSocket stops Chrome
 *   from keeping the page, so a dev server cannot show whether bfcache restores it.
 *
 * Only files inside the root folder are served, so .git, source assets, and settings stay private.
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

/**
 * @param {string} root Folder to serve
 * @param {{ port?: number, host?: string, cacheControl?: string }} [options]
 *   port 0 picks a free port. Tests use `no-store` so every run reads fresh files.
 *   A page served with `no-store` is never put in bfcache, so the preview command uses `no-cache`.
 */
export const startServer = (root, { port = 0, host = '127.0.0.1', cacheControl = 'no-store' } = {}) => new Promise((done) => {
  const base = resolve(root);
  const server = createServer((req, res) => {
    let path;
    try {
      path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = normalize(join(base, path.endsWith('/') ? `${path}index.html` : path));
    if (!file.startsWith(base + sep)) {
      res.writeHead(403).end();
      return;
    }
    let stat;
    try {
      stat = statSync(file);
    } catch {
      res.writeHead(404).end();
      return;
    }
    if (!stat.isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': cacheControl,
    });
    createReadStream(file).pipe(res);
  });
  server.listen(port, host, () => {
    const address = server.address();
    done({ url: `http://${host}:${address.port}`, close: () => new Promise((r) => server.close(r)) });
  });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 3001;
  const folder = args.find((a, i) => !a.startsWith('--') && i !== portIndex + 1) ?? 'public';
  const { url } = await startServer(folder, { port, host: 'localhost', cacheControl: 'no-cache' });
  console.log(`Serving ${folder}/ at ${url}/ (Ctrl + C to stop)`);
}
