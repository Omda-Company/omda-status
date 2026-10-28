import 'server-only'
import { supabaseConfig } from '@/lib/data'

/**
 * نماذج عامة برمز (/f/<slug>)، من غير باسورد اللوحة.
 *
 * الريبو public، فمحتوى النموذج مش هنا. الصفحة نفسها متخزنة في dashboard_data
 * (key = 'form:<slug>')، وكل إرسال بيتخزن صف لوحده (key = 'resp:<slug>:<وقت>-<عشوائي>').
 * الجدول عليه RLS من غير policies، فالسيرفر بس هو اللي بيقرا ويكتب بالمفتاح السري.
 */

export type FormPage = { title: string; html: string; expires_at: string }

export const SLUG = /^[a-z0-9-]{12,64}$/

export async function getForm(slug: string): Promise<FormPage | null> {
  if (!SLUG.test(slug)) return null
  const { url, key, ready } = supabaseConfig()
  if (!ready) return null
  const res = await fetch(`${url}/rest/v1/dashboard_data?key=eq.${encodeURIComponent('form:' + slug)}&select=data`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const rows = (await res.json()) as { data: FormPage }[]
  const form = rows[0]?.data
  if (!form?.html || !form.expires_at || Date.parse(form.expires_at) < Date.now()) return null
  return form
}

export async function saveResponse(slug: string, answers: unknown, userAgent: string) {
  const { url, key } = supabaseConfig()
  const id = `resp:${slug}:${new Date().toISOString()}-${crypto.randomUUID().slice(0, 8)}`
  const res = await fetch(`${url}/rest/v1/dashboard_data`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ key: id, data: { slug, answers, userAgent: userAgent.slice(0, 300) } }),
  })
  return res.ok
}
