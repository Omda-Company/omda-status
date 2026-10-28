import { NextResponse } from 'next/server'
import { CLIENT, getForm, getSaved, saveResponse, SLUG } from '@/lib/forms'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 64 * 1024
const no = (reason: string, status: number) => NextResponse.json({ ok: false, reason }, { status })

/** آخر حفظ للجهاز ده (عشان الصفحة ترجّعه لو اتفتحت تاني). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const slug = q.get('slug') || ''
  const client = q.get('client') || ''
  if (!SLUG.test(slug) || !CLIENT.test(client)) return no('bad_request', 400)
  if (!(await getForm(slug))) return no('not_found', 404)
  const saved = await getSaved(slug, client)
  return NextResponse.json({ ok: true, saved })
}

/** حفظ أو إرسال نهائي. بيرجّع اللي اتقري من الداتابيز بعد الحفظ، مش اللي اتبعت. */
export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > MAX_BYTES) return no('too_large', 413)

  let body: { slug?: unknown; client?: unknown; answers?: unknown; final?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return no('bad_json', 400)
  }
  const slug = typeof body.slug === 'string' ? body.slug : ''
  const client = typeof body.client === 'string' ? body.client : ''
  const answers = body.answers
  if (!SLUG.test(slug) || !CLIENT.test(client) || typeof answers !== 'object' || answers === null || Array.isArray(answers)) {
    return no('bad_request', 400)
  }
  if (!(await getForm(slug))) return no('not_found', 404)

  const saved = await saveResponse(slug, client, answers as Record<string, unknown>, body.final === true, req.headers.get('user-agent') || '')
  if (!saved) return no('not_saved', 502)
  return NextResponse.json({ ok: true, saved })
}
