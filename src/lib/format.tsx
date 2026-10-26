import { budget, payments, reimbursements, type Payment } from '@/data/status'

const AR = '٠١٢٣٤٥٦٧٨٩'

/** أرقام عربية في النص العربي. المبالغ بالدولار تفضل بالأرقام الغربية زي ما بتتكتب عادة. */
export const ar = (v: string | number) => {
  const s = String(v)
  return s.includes('$') ? s : s.replace(/\d/g, (d) => AR[Number(d)])
}

export const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

export const fmtDay = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })

export const daysSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00+02:00').getTime()) / 86_400_000))

export const usd = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
export const egp = (n: number) => Math.round(n).toLocaleString('ar-EG') + ' ج.م'
export const range = ([a, b]: [number, number], f = usd) => (a === b ? f(a) : `${f(a)} – ${f(b)}`)

/** مبلغ اتجاهه ثابت من الشمال لليمين، عشان "40 – 60" ما يتقريش مقلوب جوه النص العربي. */
export const Money = ({ children }: { children: React.ReactNode }) => (
  <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>
    {children}
  </bdi>
)

export const toEgp = (p: Payment) => p.usd * p.rate

/** إجماليات المصروفات: كل عملية بسعر صرف يوم شرائها. */
export function spendTotals() {
  const totalUsd = payments.reduce((s, p) => s + p.usd, 0)
  const totalEgp = payments.reduce((s, p) => s + toEgp(p), 0)
  const paidBackEgp = reimbursements.reduce((s, r) => s + r.egp, 0)
  const owedEgp = Math.max(0, totalEgp - paidBackEgp)
  const monthlyUsd = payments.filter((p) => p.recurring === 'monthly').reduce((s, p) => s + p.usd, 0)
  // سعر مرجعي للتقديرات: سعر آخر عملية شراء
  const latest = [...payments].sort((a, b) => b.date.localeCompare(a.date))[0]
  const refRate = latest?.rate ?? 0
  const requested: [number, number] = [budget.reduce((s, b) => s + b.monthly[0], 0), budget.reduce((s, b) => s + b.monthly[1], 0)]
  return { totalUsd, totalEgp, owedEgp, paidBackEgp, monthlyUsd, refRate, refDate: latest?.date, requested }
}

export type Settle = { state: 'paid' | 'partial' | 'owed'; remaining: number }

/** توزيع دفعات السداد على المشتريات من الأقدم للأحدث، فيبان كل عملية اتسددت قد إيه. */
export function settlement(): Map<Payment, Settle> {
  let pool = reimbursements.reduce((s, r) => s + r.egp, 0)
  const out = new Map<Payment, Settle>()
  const oldestFirst = payments.map((p, i) => ({ p, i })).sort((a, b) => a.p.date.localeCompare(b.p.date) || a.i - b.i)
  for (const { p } of oldestFirst) {
    const cost = toEgp(p)
    const covered = Math.min(pool, cost)
    pool -= covered
    const remaining = cost - covered
    out.set(p, { state: remaining <= 0.5 ? 'paid' : covered > 0 ? 'partial' : 'owed', remaining })
  }
  return out
}

export const RECURRING: Record<Payment['recurring'], string> = { monthly: 'شهري', yearly: 'سنوي', once: 'مرة واحدة' }
