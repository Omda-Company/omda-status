// بيرفع بيانات اللوحة لـ Supabase. التعديل بيظهر على الموقع خلال دقيقة، من غير deploy.
//
//   npm run push-data                     ← بيرفع D:\Al-Omda\data\status\status.json
//   npm run push-data -- path\to\file.json
//
// المفتاح السري بيتقري من D:\Al-Omda\.env (OMDA_SUPABASE_URL وOMDA_SUPABASE_SECRET_KEY). عمره ما يدخل الريبو.

import { readFileSync } from 'node:fs'

const ENV_FILE = 'D:/Al-Omda/.env'
const DATA_FILE = process.argv[2] || 'D:/Al-Omda/data/status/status.json'

const env = Object.fromEntries(
  readFileSync(ENV_FILE, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^"|"$/g, '')]),
)
const url = (env.OMDA_SUPABASE_URL || '').replace(/\/$/, '')
const key = env.OMDA_SUPABASE_SECRET_KEY || ''
if (!url || !key) {
  console.error(`ناقص OMDA_SUPABASE_URL أو OMDA_SUPABASE_SECRET_KEY في ${ENV_FILE}`)
  process.exit(1)
}

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))

// فحص سريع للشكل قبل الرفع، عشان ملف ناقص ما يوقّعش اللوحة
const need = ['meta', 'phases', 'days', 'budget', 'payments', 'reimbursements', 'freeTools', 'asks', 'nextNeeds']
const missing = need.filter((k) => !(k in data))
if (missing.length) {
  console.error('الملف ناقصه: ' + missing.join('، '))
  process.exit(1)
}
for (const p of data.payments) {
  if (!(p.usd > 0 && p.rate > 0 && /^\d{4}-\d{2}-\d{2}$/.test(p.date))) {
    console.error('عملية شراء ناقصة التاريخ أو المبلغ أو سعر الصرف: ' + JSON.stringify(p))
    process.exit(1)
  }
}

const res = await fetch(`${url}/rest/v1/dashboard_data?on_conflict=key`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify({ key: 'status', data, updated_at: new Date().toISOString() }),
})
if (!res.ok) {
  console.error(`فشل الرفع: ${res.status} ${await res.text()}`)
  process.exit(1)
}
console.log(`اترفع: ${data.days.length} يوم، و${data.payments.length} عمليات شراء، و${data.reimbursements.length} دفعات سداد. هيظهر خلال دقيقة.`)
