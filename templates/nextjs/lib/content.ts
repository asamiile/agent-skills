// Content loader: one JSON file per entry in content/entries/ is the single source of truth.
// Reads the file system, so it must never reach a client bundle: `server-only` turns that into a build error.
// Client components import types and pure helpers from content-schema.ts instead.
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import type { Entry } from './content-schema'

const DIR = path.join(process.cwd(), 'content', 'entries')

export const getAllEntries = cache((): Entry[] =>
  fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as Entry)
    .sort((a, b) => a.title.en.localeCompare(b.title.en)),
)

export const getEntry = (slug: string): Entry | undefined => getAllEntries().find((e) => e.slug === slug)
