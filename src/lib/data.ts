import 'server-only'
import type { Status } from '@/data/types'

/**
 * بيقرا بيانات اللوحة من Supabase على السيرفر بس. المفتاح السري عمره ما بيوصل للمتصفح.
 * الجدول عليه RLS ومن غير أي policies، فالمفتاح العام ما يقدرش يقراه.
 * بيتخزن في الكاش دقيقة، فأي تحديث بيظهر خلال دقيقة من غير deploy.
 */

export function supabaseConfig() {
  // أسماء صريحة، مش متركّبة (نفس سبب auth.ts)
  const url = (process.env.SUPABASE_URL || process.env.OMDA_SUPABASE_URL || '').trim().replace(/\/$/, '')
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.OMDA_SUPABASE_SECRET_KEY || '').trim()
  // http مسموح لـ 127.0.0.1 بس، للتجربة على الجهاز
  const okUrl = url.startsWith('https://') || url.startsWith('http://127.0.0.1')
  return { url, key, ready: okUrl && key.length > 20 }
}

export async function getStatus(): Promise<Status> {
  const { url, key, ready } = supabaseConfig()
  if (!ready) throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).')

  const res = await fetch(`${url}/rest/v1/dashboard_data?key=eq.status&select=data`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 60, tags: ['status'] },
  })
  if (!res.ok) throw new Error(`Supabase responded ${res.status}`)
  const rows = (await res.json()) as { data: Status }[]
  if (!rows[0]?.data) throw new Error('No dashboard data row (key = status).')
  return rows[0].data
}
