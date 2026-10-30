// ESLint settings for TypeScript in the browser and Node scripts
// - Recommended rules of @eslint/js and typescript-eslint
// - Compiled .js next to the .ts sources is ignored
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const nodeGlobals = { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly', setTimeout: 'readonly' };

// Code passed to page.evaluate() in browser tests runs in the page
const browserGlobals = {
  window: 'readonly', document: 'readonly', getComputedStyle: 'readonly', Image: 'readonly',
  requestAnimationFrame: 'readonly', performance: 'readonly', HTMLCanvasElement: 'readonly', MutationObserver: 'readonly',
};

export default tseslint.config(
  { ignores: ['public/**/*.js', 'dist/**', 'release/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/**/*.mjs', '*.mjs'], languageOptions: { globals: nodeGlobals } },
  { files: ['tests/**/*.mjs'], languageOptions: { globals: { ...nodeGlobals, ...browserGlobals } } },
  { files: ['*.cjs'], languageOptions: { sourceType: 'commonjs', globals: { ...nodeGlobals, module: 'writable', require: 'readonly' } } },
);
