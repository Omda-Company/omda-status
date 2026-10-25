import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE, config as authConfig, same, tokenFor } from '@/lib/auth'

/** كل صفحة مقفولة ما عدا صفحة الدخول ومسارها، واللوجو. */
export async function middleware(req: NextRequest) {
  const { ready, password, secret } = authConfig()
  if (!ready) {
    return new NextResponse('اللوحة غير مهيأة بعد.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  const cookie = req.cookies.get(COOKIE)?.value ?? ''
  if (cookie && same(cookie, await tokenFor(password, secret))) return NextResponse.next()

  return new NextResponse(null, { status: 307, headers: { Location: '/login', 'Cache-Control': 'no-store' } })
}

export const config = {
  matcher: ['/((?!login|api/login|_next/static|_next/image|logo.png|favicon.ico|robots.txt).*)'],
}
