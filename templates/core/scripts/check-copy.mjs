#!/usr/bin/env node
/*
 * Mechanical checks for localized copy in JSON files (Node built-in modules only)
 *
 *   node scripts/check-copy.mjs content/en.json content/ja.json [more locale files...]
 *   node scripts/check-copy.mjs --no-colons ...      also flag colons in prose
 *
 * The first file is the reference locale. Checks:
 *   parity      every file has the same keys and the same array lengths as the reference
 *   empty       no empty strings
 *   arithmetic  "A op B = C" and "A^B = C" written in the text are actually true (op: + - × x * ÷ /)
 *   colons      (optional) ':' or '：' used in prose; URLs, times, and code spans are ignored
 * Deterministic and cheap: run it in CI. Judgment calls (style, accuracy, consistency) belong to a review.
 * Exits 1 when anything is found.
 */
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const checkColons = args.includes('--no-colons')
const files = args.filter((a) => !a.startsWith('--'))
if (files.length < 1) {
  console.error('Usage: node scripts/check-copy.mjs [--no-colons] <reference.json> [other-locale.json ...]')
  process.exit(2)
}

const findings = []
const report = (file, path, message) => findings.push(`${file} ${path}: ${message}`)
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function compare(ref, other, path, file) {
  if (Array.isArray(ref)) {
    if (!Array.isArray(other)) return report(file, path, 'should be an array')
    if (ref.length !== other.length) report(file, path, `has ${other.length} items, reference has ${ref.length}`)
    ref.slice(0, other.length).forEach((v, i) => compare(v, other[i], `${path}[${i}]`, file))
  } else if (isObject(ref)) {
    if (!isObject(other)) return report(file, path, 'should be an object')
    for (const key of Object.keys(ref)) {
      if (key in other) compare(ref[key], other[key], `${path}.${key}`, file)
      else report(file, `${path}.${key}`, 'missing')
    }
    for (const key of Object.keys(other)) if (!(key in ref)) report(file, `${path}.${key}`, 'not in the reference locale')
  } else if (typeof ref !== typeof other) {
    report(file, path, `is ${typeof other}, reference is ${typeof ref}`)
  }
}

function* strings(value, path) {
  if (typeof value === 'string') yield [path, value]
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${path}[${i}]`)
  else if (isObject(value)) for (const [k, v] of Object.entries(value)) yield* strings(v, `${path}.${k}`)
}

const NUM = String.raw`-?\d+(?:[.,]\d+)?`
const OP = String.raw`[+\-×x*÷/]`
const CHAIN = new RegExp(String.raw`(${NUM}(?:\s*${OP}\s*${NUM})+)\s*=\s*(${NUM})`, 'g')
const POWER = new RegExp(String.raw`(\d+)\s*\^\s*(\d+)\s*=\s*(${NUM})`, 'g')
const toNumber = (s) => Number(s.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'))

function evaluate(expression) {
  // Left to right with × ÷ before + -, enough for the short sums written in prose
  const tokens = expression.match(new RegExp(`${NUM}|${OP}`, 'g'))
  const values = [toNumber(tokens[0])]
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const n = toNumber(tokens[i + 1])
    if ('×x*'.includes(op)) values.push(values.pop() * n)
    else if ('÷/'.includes(op)) values.push(values.pop() / n)
    else {
      values.push(op === '-' ? -n : n)
    }
  }
  return values.reduce((a, b) => a + b, 0)
}

function checkText(file, path, text) {
  if (!text.trim()) report(file, path, 'empty string')
  for (const [, lhs, rhs] of text.matchAll(CHAIN)) {
    const got = evaluate(lhs)
    if (Math.abs(got - toNumber(rhs)) > 1e-9 * Math.max(1, Math.abs(got))) report(file, path, `"${lhs} = ${rhs}" is wrong (${got})`)
  }
  for (const [, base, exp, rhs] of text.matchAll(POWER)) {
    const got = Number(base) ** Number(exp)
    if (got !== toNumber(rhs)) report(file, path, `"${base}^${exp} = ${rhs}" is wrong (${got})`)
  }
  if (checkColons) {
    const prose = text.replace(/`[^`]*`/g, '').replace(/https?:\/\/\S+/g, '').replace(/\b\d{1,2}:\d{2}\b/g, '')
    if (/[:：]/.test(prose)) report(file, path, 'uses a colon')
  }
}

const data = files.map((f) => [f, JSON.parse(readFileSync(f, 'utf8'))])
const [[refFile, ref]] = data
for (const [file, value] of data.slice(1)) compare(ref, value, '$', file)
for (const [file, value] of data) for (const [path, text] of strings(value, '$')) checkText(file, path, text)

if (findings.length) {
  findings.forEach((f) => console.error(`✖ ${f}`))
  console.error(`${findings.length} findings (reference: ${refFile})`)
  process.exit(1)
}
console.log(`✔ ${files.length} files checked, no findings (reference: ${refFile})`)
