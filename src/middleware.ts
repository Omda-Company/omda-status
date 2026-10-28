import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE, config as authConfig, same, tokenFor } from '@/lib/auth'

/** كل صفحة مقفولة ما عدا صفحة الدخول ومسارها، واللوجو، والنماذج العامة بالرمز (/f و/api/form). */
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

  // الـ middleware لازم يحوّل لعنوان كامل (Next بيرفض العنوان النسبي هنا). nextUrl بياخد الدومين من الطلب نفسه.
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!login|api/login|api/keepalive|api/form|f/|_next/static|_next/image|logo.png|favicon.ico|robots.txt).*)'],
}
