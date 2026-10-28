import { getForm } from '@/lib/forms'

export const dynamic = 'force-dynamic'

/** صفحة النموذج بالرمز. لو الرمز غلط أو انتهى، نفس الرد في الحالتين. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await getForm(slug)
  const headers = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
  }
  if (!form) {
    return new Response('الرابط غير متاح.', { status: 404, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } })
  }
  return new Response(form.html, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } })
}
