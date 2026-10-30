// /llms.txt, generated from content so it never drifts from the site (format: https://llmstxt.org)
import { getAllEntries } from '@/lib/content'
import { entryMarkdownPath } from '@/lib/content-schema'

export const dynamic = 'force-static'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{domain}'

export function GET() {
  const entries = getAllEntries()
  const lines = [
    '# {Site name}',
    '',
    '> {One sentence: what the collection is and how an agent should use it.}',
    '',
    `- All entries as JSON: ${SITE_URL}/api/entries`,
    `- One entry as Markdown: ${SITE_URL}/api/entries/{slug}/md`,
    '',
  ]
  for (const category of [...new Set(entries.map((e) => e.category))].sort()) {
    lines.push(`## ${category}`, '')
    for (const e of entries.filter((x) => x.category === category)) {
      lines.push(`- [${e.title.en}](${SITE_URL}${entryMarkdownPath(e.slug)}): ${e.summary.en}`)
    }
    lines.push('')
  }
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
