#!/usr/bin/env node
/*
 * Validates one-entry-per-file JSON content against a small declarative schema (Node built-in modules only)
 *
 *   node scripts/validate-content.mjs [content-dir]      (default: content/entries)
 *
 * Keep SCHEMA in step with the TypeScript type and the schema document: change all three together.
 * Field types:
 *   string          non-empty string                    enum      one of `values`
 *   slug            kebab-case ASCII, equal to the file name
 *   localized       { [locale]: non-empty string } for every locale in LOCALES
 *   strings         array of non-empty strings, at least `min`
 *   links           array of { label, url } with an http(s) url
 *   images          array of { src, alt }; local src must exist under public/
 *   custom          `check(value, entry)` returns a list of error messages
 * Exits 1 when any file has errors, so CI can gate on it.
 */
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.resolve(process.argv[2] ?? 'content/entries')
const PUBLIC_DIR = path.resolve('public')
const LOCALES = ['en', 'ja']

const SCHEMA = {
  slug: { type: 'slug', required: true },
  category: { type: 'enum', values: ['{category-a}', '{category-b}'], required: true },
  title: { type: 'localized', required: true },
  summary: { type: 'localized', required: true },
  tags: { type: 'strings', min: 1, required: true },
  keywords: { type: 'strings', min: 3, required: true }, // AI-facing fields: write them in English
  prompt: { type: 'string', required: true },
  references: { type: 'links' },
  images: { type: 'images' },
  // Example of a domain-specific rule: color shares must add up to 1
  palette: {
    type: 'custom',
    check: (value) => {
      if (value == null) return []
      if (!Array.isArray(value) || value.length < 2) return ['needs at least 2 colors']
      const errors = value.flatMap((c, i) => (/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c?.hex ?? '') ? [] : [`[${i}].hex must be #RRGGBB or #RRGGBBAA`]))
      const ratios = value.map((c) => c.ratio).filter((r) => r != null)
      if (ratios.length === value.length && Math.abs(ratios.reduce((a, b) => a + b, 0) - 1) > 0.02) errors.push('ratios must add up to 1')
      return errors
    },
  },
}

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0

function checkField(name, rule, value, file) {
  if (value == null) return rule.required ? [`${name} is required`] : []
  switch (rule.type) {
    case 'string':
      return nonEmpty(value) ? [] : [`${name} must be a non-empty string`]
    case 'enum':
      return rule.values.includes(value) ? [] : [`${name} must be one of ${rule.values.join(', ')}`]
    case 'slug': {
      const expected = path.basename(file, '.json')
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return [`${name} must be kebab-case ASCII`]
      return value === expected ? [] : [`${name} "${value}" must match the file name "${expected}"`]
    }
    case 'localized':
      return LOCALES.filter((l) => !nonEmpty(value?.[l])).map((l) => `${name}.${l} is required`)
    case 'strings':
      return Array.isArray(value) && value.length >= (rule.min ?? 0) && value.every(nonEmpty) ? [] : [`${name} needs at least ${rule.min ?? 0} non-empty strings`]
    case 'links':
      return Array.isArray(value) ? value.flatMap((l, i) => (nonEmpty(l?.label) && /^https?:\/\//.test(l?.url ?? '') ? [] : [`${name}[${i}] needs a label and an http(s) url`])) : [`${name} must be an array`]
    case 'images':
      return Array.isArray(value)
        ? value.flatMap((img, i) => {
            if (!nonEmpty(img?.src) || !nonEmpty(img?.alt)) return [`${name}[${i}] needs src and alt`]
            if (img.src.startsWith('/') && !fs.existsSync(path.join(PUBLIC_DIR, img.src))) return [`${name}[${i}].src ${img.src} not found in public/`]
            return []
          })
        : [`${name} must be an array`]
    case 'custom':
      return rule.check(value).map((m) => `${name}${m.startsWith('[') ? '' : ' '}${m}`)
    default:
      return [`unknown rule type ${rule.type}`]
  }
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
let failed = 0
const seen = new Map()
for (const file of files) {
  let entry
  try {
    entry = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  } catch (error) {
    console.error(`✖ ${file}: invalid JSON (${error.message})`)
    failed++
    continue
  }
  const errors = Object.entries(SCHEMA).flatMap(([name, rule]) => checkField(name, rule, entry[name], file))
  const unknown = Object.keys(entry).filter((k) => !(k in SCHEMA))
  if (unknown.length) errors.push(`unknown fields: ${unknown.join(', ')} (add them to the schema first)`)
  const title = entry.title?.en?.toLowerCase()
  if (title && seen.has(title)) errors.push(`same English title as ${seen.get(title)}`)
  if (title) seen.set(title, file)
  if (errors.length) {
    failed++
    console.error(`✖ ${file}`)
    errors.forEach((e) => console.error(`    ${e}`))
  }
}
console.log(`${files.length - failed}/${files.length} entries valid`)
process.exit(failed ? 1 : 0)
