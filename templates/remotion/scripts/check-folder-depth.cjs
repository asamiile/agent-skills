#!/usr/bin/env node
/*
 * Fails when Studio <Folder> nesting is deeper than MAX_DEPTH in any registration file (src/root*.tsx)
 * Deep trees are hard to browse and drift from the source layout and the output folders.
 *
 *   node scripts/check-folder-depth.cjs [max-depth]
 */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const MAX_DEPTH = Number(process.argv[2] ?? 3);
const files = fs.readdirSync('src').filter((f) => /^root.*\.tsx$/i.test(f)).map((f) => path.join('src', f));

let count = 0;
let deepest = 0;
const errors = [];
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node, folders) => {
    let next = folders;
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'Folder') {
      const attr = node.openingElement.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText(source) === 'name');
      const name = attr?.initializer && ts.isStringLiteral(attr.initializer) ? attr.initializer.text : '<dynamic>';
      next = [...folders, name];
      count++;
      deepest = Math.max(deepest, next.length);
      if (next.length > MAX_DEPTH) errors.push(`${file}: ${next.join('/')}`);
    }
    ts.forEachChild(node, (child) => visit(child, next));
  };
  visit(source, []);
}
if (errors.length) {
  console.error(`Folders deeper than ${MAX_DEPTH}:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`${count} folders in ${files.length} files; deepest ${deepest} (limit ${MAX_DEPTH})`);
