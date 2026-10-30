/*
 * Runs the browser tests (`pnpm test`, `pnpm test:update`, `pnpm test:dist`)
 * - --update: rewrite the baselines. Environment variables are set here so the command also works on Windows
 * - --dist: run against the deliverable in dist/ (baselines are shared with public/)
 * Tests run one file at a time because they share one browser and compare screenshots.
 */
import { spawnSync } from 'node:child_process';

const update = process.argv.includes('--update');
const dist = process.argv.includes('--dist');
const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '--test-concurrency=1', 'tests/visual.test.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, TEST_UPDATE: update ? '1' : '', TEST_ROOT: dist ? 'dist' : '' },
});
process.exit(result.status ?? 1);
