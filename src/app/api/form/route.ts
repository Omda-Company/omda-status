import { NextResponse } from 'next/server'
import { getForm, saveResponse, SLUG } from '@/lib/forms'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 64 * 1024

/** إرسال إجابات نموذج. بيتقبل بس لرمز موجود وما انتهاش. */
export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > MAX_BYTES) return NextResponse.json({ ok: false, reason: 'too_large' }, { status: 413 })

  let body: { slug?: unknown; answers?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_json' }, { status: 400 })
  }
  const slug = typeof body.slug === 'string' ? body.slug : ''
  if (!SLUG.test(slug) || typeof body.answers !== 'object' || body.answers === null || Array.isArray(body.answers)) {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 })
  }
  if (!(await getForm(slug))) return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })

  const ok = await saveResponse(slug, body.answers, req.headers.get('user-agent') || '')
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 })
}
