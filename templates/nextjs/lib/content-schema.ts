// Types and pure helpers shared by server and client code (no file system access here).
// Keep in step with scripts/validate-content.mjs and the schema document.
export const LOCALES = ['en', 'ja'] as const
export type Locale = (typeof LOCALES)[number]
export type Localized = Record<Locale, string>

export type Entry = {
  slug: string
  category: string
  title: Localized
  summary: Localized
  tags: string[]
  keywords: string[] // AI-facing fields are English
  prompt: string
  references?: { label: string; url: string }[]
}

export const entryMarkdownPath = (slug: string) => `/api/entries/${slug}/md`

// The Markdown brief an agent or a person pastes into a chat
export function toMarkdown(e: Entry): string {
  return [
    `# ${e.title.en}`,
    '',
    e.summary.en,
    '',
    `Category: ${e.category}`,
    `Keywords: ${e.keywords.join(', ')}`,
    '',
    '## Prompt',
    '',
    e.prompt,
    ...(e.references?.length ? ['', '## References', '', ...e.references.map((r) => `- [${r.label}](${r.url})`)] : []),
    '',
  ].join('\n')
}
