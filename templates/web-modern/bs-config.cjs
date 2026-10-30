/*
 * browser-sync settings for local development
 * - `pnpm dev` listens on localhost only
 * - `pnpm dev:lan` (BS_LAN=1) exposes the site to the local network for checks on real devices.
 *   Everything under public/ becomes visible to that network, so use it only on a trusted network
 * - Only public/ is served (not .git, .claude, or the source assets)
 * - Reload on compiled .js changes, not on .ts saves, to avoid reloading twice
 */
const lan = process.env.BS_LAN === '1';

module.exports = {
  server: { baseDir: 'public' },
  files: ['public/**/*', '!public/**/*.ts'],
  listen: lan ? undefined : 'localhost',
  port: 3000,
  open: lan ? 'external' : 'local',
  ui: false,
  ghostMode: false,
  notify: false,
};
