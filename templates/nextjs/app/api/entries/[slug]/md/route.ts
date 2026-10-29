import { getAllEntries, getEntry } from '@/lib/content'
import { toMarkdown } from '@/lib/content-schema'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getAllEntries().map((e) => ({ slug: e.slug }))
}

export async function GET(_req: Request, ctx: RouteContext<'/api/entries/[slug]/md'>) {
  const { slug } = await ctx.params
  const entry = getEntry(slug)
  if (!entry) return new Response('Not found', { status: 404 })
  return new Response(toMarkdown(entry), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
