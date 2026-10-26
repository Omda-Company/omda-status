import { NextResponse } from 'next/server'
import { supabaseConfig } from '@/lib/data'

export const dynamic = 'force-dynamic'

/**
 * Vercel بيندهها مرة كل يوم (vercel.json)، عشان مشروع Supabase المجاني ما يقفش لوحده
 * بعد أسبوع من غير نشاط. محمية بـ CRON_SECRET اللي Vercel بيبعته لوحده، ومش بترجّع أي بيانات.
 */
export async function GET(req: Request) {
  const secret = (process.env.CRON_SECRET || '').trim()
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { url, key, ready } = supabaseConfig()
  if (!ready) return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 503 })
  const res = await fetch(`${url}/rest/v1/dashboard_data?select=key&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 })
}
