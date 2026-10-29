#!/usr/bin/env node
/*
 * Prints composition IDs from the *Patterns exports of schema files, using the TypeScript AST
 * (the code is parsed, never executed, so it works before bundling)
 *
 *   node scripts/list-pattern-ids.cjs <IdPrefix> <schema-file> [exportName] [--join ""]
 *   node scripts/list-pattern-ids.cjs {Feature} src/{Category}/{Feature}/{feature}.schema.ts
 *     → {Feature}-Default, {Feature}-Fast, ...
 *
 * exportName defaults to the only export whose name ends in "Patterns".
 * Keys are turned into IDs as <IdPrefix><join><Capitalized key> (join defaults to "-").
 * Requires the project's `typescript` package.
 */
const fs = require('node:fs');
const ts = require('typescript');

const args = process.argv.slice(2);
const joinIndex = args.indexOf('--join');
const join = joinIndex >= 0 ? args.splice(joinIndex, 2)[1] : '-';
const [prefix, file, wanted] = args;
if (!prefix || !file) {
  console.error('Usage: node scripts/list-pattern-ids.cjs <IdPrefix> <schema-file> [exportName] [--join ""]');
  process.exit(2);
}

const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

// Unwrap `{...} as const`, `satisfies`, and parentheses down to the object literal
const unwrap = (node) => {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression?.(node) || ts.isParenthesizedExpression(node))) node = node.expression;
  return node;
};
const keyName = (prop) => (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : null);

const candidates = [];
source.forEachChild((node) => {
  if (!ts.isVariableStatement(node) || !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return;
  for (const decl of node.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && (wanted ? decl.name.text === wanted : decl.name.text.endsWith('Patterns'))) {
      candidates.push({ name: decl.name.text, init: unwrap(decl.initializer) });
    }
  }
});
if (candidates.length !== 1) {
  console.error(`${file}: expected one ${wanted ?? '*Patterns'} export, found ${candidates.map((c) => c.name).join(', ') || 'none'}`);
  process.exit(1);
}
const { init } = candidates[0];
if (!init || !ts.isObjectLiteralExpression(init)) {
  console.error(`${file}: ${candidates[0].name} is not an object literal`);
  process.exit(1);
}
for (const prop of init.properties) {
  const key = (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) && keyName(prop);
  if (key) console.log(`${prefix}${join}${key.charAt(0).toUpperCase()}${key.slice(1)}`);
}
