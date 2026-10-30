// Request proxy (Next.js 16+; replaces middleware.ts)
// - /admin/*: send signed-out visitors to the sign-in page
// - Localized public pages: an explicit /{locale}/... URL always wins and is remembered in a cookie;
//   a bare path uses the cookie, then Accept-Language, then the default locale
// The proxy is a first line only: every Server Function and route handler must check auth again,
// because a matcher change can silently remove proxy coverage.
import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'
const COOKIE = 'locale'
const ONE_YEAR = 60 * 60 * 24 * 365
// Pages that exist per locale, served as /path (default locale) and /{locale}/path (others)
const LOCALIZED_PATHS = ['/contact']

const isLocale = (value: string | undefined): value is Locale => LOCALES.includes(value as Locale)

// Replace with the auth library's session check (for example its `auth()` helper)
async function isSignedIn(req: NextRequest): Promise<boolean> {
  return req.cookies.has('{session-cookie}')
}

function localeFromAcceptLanguage(header: string | null): Locale {
  for (const part of header?.split(',') ?? []) {
    const tag = part.split(';')[0].trim().toLowerCase().split('-')[0]
    if (isLocale(tag)) return tag
  }
  return DEFAULT_LOCALE
}

function withLocale(req: NextRequest, locale: Locale, rememberCookie: boolean): NextResponse {
  const headers = new Headers(req.headers)
  headers.set('x-locale', locale) // read with headers() in server components
  const res = NextResponse.next({ request: { headers } })
  if (rememberCookie) res.cookies.set(COOKIE, locale, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' })
  return res
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!(await isSignedIn(req))) {
      const url = new URL('/admin/login', req.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const first = pathname.split('/')[1]
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return withLocale(req, first, req.cookies.get(COOKIE)?.value !== first)
  }

  if (LOCALIZED_PATHS.includes(pathname)) {
    const saved = req.cookies.get(COOKIE)?.value
    const locale = isLocale(saved) ? saved : localeFromAcceptLanguage(req.headers.get('accept-language'))
    if (locale !== DEFAULT_LOCALE) {
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}${pathname}`
      const res = NextResponse.redirect(url)
      res.cookies.set(COOKIE, locale, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' })
      return res
    }
    return withLocale(req, DEFAULT_LOCALE, !isLocale(saved))
  }

  return NextResponse.next()
}

export const config = {
  // Constants only: the matcher is read at build time. Static files and images never reach the proxy
  matcher: ['/admin/:path*', '/contact', '/:locale(ja)/:path*'],
}
