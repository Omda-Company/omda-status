import 'server-only'
import { supabaseConfig } from '@/lib/data'

/**
 * نماذج عامة برمز (/f/<slug>)، من غير باسورد اللوحة.
 *
 * الريبو public، فمحتوى النموذج مش هنا. الصفحة نفسها متخزنة في dashboard_data
 * (key = 'form:<slug>')، وإجابات كل جهاز في صف واحد بيتحدث مع كل حفظ
 * (key = 'resp:<slug>:<client>')، والإرسال النهائي بياخد نسخة ثابتة كمان
 * (key = 'resp:<slug>:<client>:final:<وقت>').
 * الجدول عليه RLS من غير policies، فالسيرفر بس هو اللي بيقرا ويكتب بالمفتاح السري.
 */

export type FormPage = { title: string; html: string; expires_at: string }
export type Saved = { answers: Record<string, unknown>; savedAt: string; final: boolean }

export const SLUG = /^[a-z0-9-]{12,64}$/
export const CLIENT = /^[a-z0-9]{12,40}$/

function rest(path: string, init: RequestInit = {}) {
  const { url, key } = supabaseConfig()
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  })
}

export async function getForm(slug: string): Promise<FormPage | null> {
  if (!SLUG.test(slug) || !supabaseConfig().ready) return null
  const res = await rest(`dashboard_data?key=eq.${encodeURIComponent('form:' + slug)}&select=data`)
  if (!res.ok) return null
  const rows = (await res.json()) as { data: FormPage }[]
  const form = rows[0]?.data
  if (!form?.html || !form.expires_at || Date.parse(form.expires_at) < Date.now()) return null
  return form
}

export async function getSaved(slug: string, client: string): Promise<Saved | null> {
  const res = await rest(`dashboard_data?key=eq.${encodeURIComponent(`resp:${slug}:${client}`)}&select=data`)
  if (!res.ok) return null
  const rows = (await res.json()) as { data: Saved }[]
  return rows[0]?.data ?? null
}

/** بيحفظ، وبعدين بيقرا تاني من الداتابيز. بيرجّع اللي اتقري فعلًا، عشان الصفحة تتأكد إنه مطابق. */
export async function saveResponse(slug: string, client: string, answers: Record<string, unknown>, final: boolean, userAgent: string) {
  const savedAt = new Date().toISOString()
  const data = { slug, answers, final, savedAt, userAgent: userAgent.slice(0, 300) }
  const rows = [{ key: `resp:${slug}:${client}`, data, updated_at: savedAt }]
  if (final) rows.push({ key: `resp:${slug}:${client}:final:${savedAt}`, data, updated_at: savedAt })
  const res = await rest('dashboard_data?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) return null
  const back = await getSaved(slug, client)
  return back && back.savedAt === savedAt ? back : null
}
