import { NextResponse } from 'next/server'
import { config as authConfig } from '@/lib/auth'
import { supabaseConfig } from '@/lib/data'

export const dynamic = 'force-dynamic'

/**
 * فحص الإعداد، ورا الباسورد (الـ middleware بيحميه). بيرجّع أسامي المتغيرات الموجودة
 * وهل Supabase بيرد، وعمره ما بيرجّع أي قيمة. لما حاجة ما تشتغلش على Vercel، دي أول حاجة تتفتح.
 */
export async function GET() {
  const s = supabaseConfig()
  let supabase: string = 'not_configured'
  if (s.ready) {
    try {
      const res = await fetch(`${s.url}/rest/v1/dashboard_data?select=key`, {
        headers: { apikey: s.key, Authorization: `Bearer ${s.key}` },
        cache: 'no-store',
      })
      const rows = res.ok ? ((await res.json()) as { key: string }[]) : []
      supabase = res.ok ? (rows.some((r) => r.key === 'status') ? 'ok' : 'no_status_row') : `http_${res.status}`
    } catch {
      supabase = 'unreachable'
    }
  }
  return NextResponse.json(
    {
      auth: authConfig().ready,
      supabase,
      supabaseHost: s.url ? new URL(s.url).host.replace(/^[^.]{4}/, '****') : null,
      cronSecretSet: Boolean((process.env.CRON_SECRET || '').trim()),
      envNames: Object.keys(process.env).filter((n) => /STATUS|SUPABASE|CRON/i.test(n)).sort(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
