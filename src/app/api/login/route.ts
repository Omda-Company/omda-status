import { NextResponse } from 'next/server'
import { COOKIE, MAX_AGE, config, same, tokenFor } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { ready, password, secret } = config()
  const form = await req.formData().catch(() => null)
  const given = String(form?.get('password') ?? '')
  // تحويل نسبي: بيفضل على نفس الدومين اللي الكوكي اتحطت عليه، مهما كان الدومين (Vercel، أو دومين خاص، أو localhost)
  const back = (path: string) => new NextResponse(null, { status: 303, headers: { Location: path, 'Cache-Control': 'no-store' } })

  if (!ready) return back('/login?e=setup')

  const [want, got] = await Promise.all([tokenFor(password, secret), tokenFor(given, secret)])
  if (!same(want, got)) {
    // تأخير بسيط يبطّأ أي محاولة تخمين
    await new Promise((r) => setTimeout(r, 700))
    return back('/login?e=1')
  }

  const res = back('/')
  res.cookies.set(COOKIE, want, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return res
}
