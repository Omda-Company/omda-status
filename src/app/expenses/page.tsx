import CountUp from '@/components/CountUp'
import Header from '@/components/Header'
import SavingsHero from '@/components/SavingsHero'
import { getStatus } from '@/lib/data'
import { Money, RECURRING, ar, egp, fmtDate, range, saved, savingTotals, settlement, spendTotals, toEgp, usd } from '@/lib/format'
import type { Saving } from '@/data/types'

export const dynamic = 'force-dynamic'

const STATUS = {
  paid: { cls: 'ok', text: '✓ مدفوع' },
  approved: { cls: 'ok', text: '✓ معتمد' },
  pending: { cls: 'wait', text: 'بانتظار الاعتماد' },
  free: { cls: 'free', text: 'مجاني' },
} as const

const PART_COLORS = ['var(--save)', 'var(--gold)', '#4f9fb8']

/** مدة استرداد تكلفة لمرة واحدة من الوفر الشهري (بالحد الأدنى). */
function payback(onceEgp: number, monthlyEgp: number) {
  if (monthlyEgp <= 0) return null
  const m = onceEgp / monthlyEgp
  if (m < 0.9) return 'أقل من شهر'
  if (m < 1.5) return 'نحو شهر واحد'
  return `نحو ${ar(Math.round(m))} أشهر`
}

/** البند الأبرز في الوفر: دفعنا مرة واحدة ← بنوفّر كل شهر، ومدة الاسترداد، والنمو، والتفصيل، وطريقة الحساب. */
function Featured({ s, rate }: { s: Saving; rate: number }) {
  const [lo, hi] = saved(s).map((n) => n * rate) as [number, number]
  const pb = s.onceEgp ? payback(s.onceEgp, lo) : null
  const partsMax = (s.parts ?? []).reduce((n, p) => n + p.usd[1], 0)
  return (
    <section className="feat" aria-labelledby="feat-h">
      <div className="feat-h">
        <span className="feat-tag">الإنجاز الأبرز</span>
        <h2 id="feat-h">
          {s.item}
          {s.term && (
            <>
              {' '}
              <small dir="ltr">({s.term})</small>
            </>
          )}
        </h2>
        {s.explain && <p>{s.explain}</p>}
      </div>

      <div className="flow">
        <div className="flow-box paid">
          <small>دفعنا مرة واحدة</small>
          <b className="num">{s.onceEgp ? (<><CountUp value={s.onceEgp} kind="num" ms={1100} /> <small className="cur">ج.م</small></>) : s.once}</b>
          <span>{s.ourWay}</span>
        </div>
        <div className="flow-arrow" aria-hidden>
          ←
        </div>
        <div className="flow-box gain">
          <small>نوفّر كل شهر</small>
          <b className="num">
            <CountUp value={lo} kind="num" delay={300} /> – <CountUp value={hi} kind="num" delay={420} /> <small className="cur">ج.م</small>
          </b>
          <span>{s.instead}</span>
        </div>
      </div>

      <div className="feat-facts">
        {pb && (
          <div className="fact">
            <span>استرداد التكلفة</span>
            <b>{pb}</b>
          </div>
        )}
        {s.growthUsd && (
          <div className="fact">
            <span>مع نمو المبيعات يصل الوفر إلى</span>
            <b className="num">
              {Math.round(s.growthUsd[0] * rate).toLocaleString('ar-EG')} – {egp(s.growthUsd[1] * rate)} شهريًا
            </b>
          </div>
        )}
        <div className="fact">
          <span>الملكية</span>
          <b>النماذج ملك للشركة، وتُستخدم في كل نظام قادم</b>
        </div>
      </div>

      {s.parts && s.parts.length > 0 && (
        <div className="parts">
          <p className="parts-h">مصادر الوفر الشهري</p>
          <div className="parts-bar" aria-hidden>
            {s.parts.map((p, i) => (
              <i key={p.name} style={{ flex: p.usd[1], background: PART_COLORS[i % PART_COLORS.length] }} />
            ))}
          </div>
          <ul className="parts-list">
            {s.parts.map((p, i) => (
              <li key={p.name}>
                <span className="dot" style={{ background: PART_COLORS[i % PART_COLORS.length] }} />
                {p.name}
                <b className="num">
                  {Math.round(p.usd[0] * rate).toLocaleString('ar-EG')} – {egp(p.usd[1] * rate)}
                </b>
                <small className="num">{Math.round((p.usd[1] / partsMax) * 100).toLocaleString('ar-EG')}٪</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.method && s.method.length > 0 && (
        <details className="how">
          <summary>كيف حسبنا هذا الرقم؟</summary>
          <ul>
            {s.method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

export default async function Expenses() {
  const data = await getStatus()
  const { budget, freeTools, meta, payments, reimbursements, savings = [] } = data
  const sv = savingTotals(savings)
  const t = spendTotals(data)
  const rows = [...payments].sort((a, b) => b.date.localeCompare(a.date))
  const settle = settlement(data)
  const SETTLE = {
    paid: { cls: 'ok', text: () => '✓ مسدد' },
    partial: { cls: 'wait', text: (r: number) => `متبقٍ ${egp(r)}` },
    owed: { cls: 'wait', text: () => 'مستحق' },
  } as const
  const maxLine = Math.max(...budget.map((b) => b.monthly[1]))
  const featured = savings.find((s) => s.featured)
  const others = savings.filter((s) => s !== featured)
  const monthlyEgp = sv.monthly.map((n) => n * t.refRate) as [number, number]
  const paidPct = t.totalEgp > 0 ? Math.min(100, (t.paidBackEgp / t.totalEgp) * 100) : 0

  return (
    <>
      <Header meta={meta} current="/expenses" title="المصروفات" pdfName="المصروفات" excelHref="/api/expenses-excel" />

      <main className="wrap">
        {savings.length > 0 && t.refRate > 0 && <SavingsHero monthlyEgp={monthlyEgp} spentEgp={t.totalEgp} />}

        {featured && <Featured s={featured} rate={t.refRate} />}

        {others.length > 0 && (
          <section className="panel save-panel" aria-labelledby="save-h">
            <div className="panel-h">
              <h2 id="save-h">وفر إضافي</h2>
              <p>مقارنةً بتقرير تقدير التكاليف ({ar('20 أكتوبر 2026')})</p>
            </div>
            <div className="panel-b">
              <ul className="saves">
                {others.map((s) => (
                  <li key={s.item} className="save">
                    <div className="save-top">
                      <b>
                        {s.item}
                        {s.term && (
                          <>
                            {' '}
                            <small dir="ltr">({s.term})</small>
                          </>
                        )}
                      </b>
                      <span className="chip ok num">
                        {s.insteadUsd ? <>وفر {range(saved(s).map((n) => n * t.refRate) as [number, number], egp)} شهريًا</> : (s.chip ?? 'وفر مستمر')}
                      </span>
                    </div>
                    {s.explain && <p className="save-explain">{s.explain}</p>}
                    <div className="save-cmp num">
                      <span className="save-was">
                        <small>بدلًا من</small>
                        <s>
                          {s.instead}
                          {s.insteadUsd && (
                            <>
                              {' '}
                              · <Money>{range(s.insteadUsd)}</Money>
                            </>
                          )}
                        </s>
                      </span>
                      <span className="save-now">
                        <small>ما فعلناه</small>
                        {s.ourWay} · {s.once ? <b>{s.once}</b> : <Money>{(s.ourUsd ?? 0) > 0 ? usd(s.ourUsd ?? 0) : '$0'}</Money>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="note">
                الوفر = تكلفة البديل − ما يُدفع فعليًا، شهريًا. وبالجنيه بسعر آخر عملية شراء ({ar(t.refRate)} ج.م للدولار).
              </p>
            </div>
          </section>
        )}

        <div className="divider">
          <span>المصروفات والسداد</span>
        </div>

        <section className="stats" aria-label="ملخص المصروفات">
          <div className="stat">
            <span className="stat-label">إجمالي المصروفات</span>
            <span className="stat-value num">
              <CountUp value={t.totalEgp} kind="egp" ms={1100} />
            </span>
            <span className="stat-sub num">{ar(payments.length)} بنود</span>
          </div>
          <div className="stat">
            <span className="stat-label">منها اشتراكات بالدولار</span>
            <span className="stat-value num">
              <CountUp value={t.totalUsd} kind="usd" ms={1100} />
            </span>
            <span className="stat-sub">محسوبة بسعر الصرف المسجل لكل بند</span>
          </div>
          <div className="stat stat-ok">
            <span className="stat-label">تم سداده</span>
            <span className="stat-value num">
              <CountUp value={t.paidBackEgp} kind="egp" ms={1100} />
            </span>
            <span className="settle-bar" aria-hidden>
              <i style={{ width: `${paidPct}%` }} />
            </span>
            <span className="stat-sub num">{ar(Math.floor(paidPct))}٪ من الإجمالي</span>
          </div>
          <div className={`stat ${t.owedEgp > 0 ? 'stat-alert' : 'stat-ok'}`}>
            <span className="stat-label">مستحق السداد</span>
            <span className="stat-value num">{egp(t.owedEgp)}</span>
            <span className="stat-sub">بالجنيه المصري</span>
          </div>
        </section>

        <section className="panel" aria-labelledby="buys-h">
          <div className="panel-h">
            <h2 id="buys-h">عمليات الشراء</h2>
            <p>البنود الدولارية تُحسب بالجنيه بسعر الصرف المسجل، والبنود المدفوعة بالجنيه بقيمتها الفعلية</p>
          </div>
          <div className="panel-b">
            <div className="table-wrap">
              <table className="table num">
                <thead>
                  <tr>
                    <th>تاريخ الشراء</th>
                    <th>البند</th>
                    <th>النوع</th>
                    <th>بالدولار</th>
                    <th>سعر الصرف</th>
                    <th>بالجنيه</th>
                    <th>السداد</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.date + p.item}>
                      <td>{fmtDate(p.date)}</td>
                      <td>
                        <b>{p.item}</b>
                        {p.detail && <small>{p.detail}</small>}
                      </td>
                      <td>{RECURRING[p.recurring]}</td>
                      <td>{p.usd != null ? <Money>{usd(p.usd)}</Money> : '—'}</td>
                      <td>{p.usd != null && p.egp == null ? `${ar(p.rate)} ج.م` : '—'}</td>
                      <td>
                        <b>{egp(toEgp(p))}</b>
                      </td>
                      <td>
                        {(() => {
                          const st = settle.get(p) ?? { state: 'owed' as const, remaining: toEgp(p) }
                          const v = SETTLE[st.state]
                          return <span className={`chip ${v.cls}`}>{v.text(st.remaining)}</span>
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>الإجمالي</td>
                    <td>
                      <Money>{usd(t.totalUsd)}</Money>
                    </td>
                    <td />
                    <td>{egp(t.totalEgp)}</td>
                    <td>
                      <span className={`chip ${t.owedEgp > 0 ? 'wait' : 'ok'}`}>{t.owedEgp > 0 ? `مستحق ${egp(t.owedEgp)}` : '✓ مسدد بالكامل'}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="note">
              المبلغ بالجنيه = المبلغ بالدولار × سعر الصرف المسجل، أو القيمة الفعلية المدفوعة بالجنيه عند عدم وجود سعر صرف. والاشتراكات الشهرية تُسجَّل عملية جديدة عند كل تجديد بسعر يومها.
            </p>
          </div>
        </section>

        <section className="panel" aria-labelledby="refund-h">
          <div className="panel-h">
            <h2 id="refund-h">دفعات السداد</h2>
            <p>ما سددته الشركة بالجنيه المصري</p>
          </div>
          <div className="panel-b">
            {reimbursements.length === 0 ? (
              <p className="note" style={{ margin: 0 }}>لم تُسجل دفعات سداد بعد.</p>
            ) : (
              <div className="table-wrap">
                <table className="table num" style={{ minWidth: 420 }}>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>من</th>
                      <th>ملاحظة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reimbursements].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                      <tr key={r.date + r.egp}>
                        <td>{fmtDate(r.date)}</td>
                        <td>
                          <b>{egp(r.egp)}</b>
                        </td>
                        <td>{r.from}</td>
                        <td>{r.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>إجمالي المسدد</td>
                      <td>{egp(t.paidBackEgp)}</td>
                      <td />
                      <td>
                        <span className={`chip ${t.owedEgp > 0 ? 'wait' : 'ok'}`}>{t.owedEgp > 0 ? `المتبقي ${egp(t.owedEgp)}` : '✓ لا يوجد مستحق'}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className="cols cols-even">
          <section className="panel" aria-labelledby="budget-h">
            <div className="panel-h">
              <h2 id="budget-h">بنود الميزانية الشهرية</h2>
              <p>من تقرير تقدير التكاليف ({ar('20 أكتوبر 2026')})</p>
            </div>
            <div className="panel-b">
              <ul className="lines">
                {budget.map((b) => {
                  const st = STATUS[b.status]
                  return (
                    <li key={b.name} className="line" title={b.purpose}>
                      <div className="line-top">
                        <span>
                          {b.name} <small>· {ar(b.detail)}</small>
                        </span>
                        <span className="num" style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                          <Money>{range(b.monthly)}</Money>
                          <span className={`chip ${st.cls}`}>{st.text}</span>
                        </span>
                      </div>
                      <div className="line-bar" aria-hidden>
                        <span style={{ width: `${(b.monthly[1] / maxLine) * 100}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="money num" style={{ marginTop: 14, marginBottom: 0 }}>
                <div>
                  <span>المطلوب شهريًا</span>
                  <b>
                    <Money>{range(t.requested)}</Money>
                  </b>
                </div>
                <div>
                  <span>تقديريًا بالجنيه</span>
                  <b>
                    {ar(Math.round(t.requested[0] * t.refRate).toLocaleString('en-US').replace(/,/g, '٬'))} – {egp(t.requested[1] * t.refRate)}
                  </b>
                </div>
                <div>
                  <span>سنويًا كحد أقصى</span>
                  <b>
                    <Money>{usd(t.requested[1] * 12)}</Money>
                  </b>
                </div>
              </div>
              {t.refRate > 0 && t.refDate && (
                <p className="note">
                  التقدير بالجنيه بسعر آخر عملية شراء ({ar(t.refRate)} ج.م للدولار في {fmtDate(t.refDate)})، ويتغير مع سعر الصرف.
                </p>
              )}
            </div>
          </section>

          <section className="panel" aria-labelledby="free-h">
            <div className="panel-h">
              <h2 id="free-h">أُنجز بأدوات مجانية</h2>
              <p>دون تحميل الميزانية</p>
            </div>
            <div className="panel-b">
              <ul className="free-list" style={{ marginTop: 0 }}>
                {freeTools.map((f) => (
                  <li key={f.name}>
                    <span>
                      {f.name} <small>· {f.use}</small>
                    </span>
                    <small className="num">{ar(f.cost)}</small>
                  </li>
                ))}
              </ul>
              <p className="note">أي مشروع جديد يُعرض له تقدير تكاليف مستقل قبل البدء.</p>
            </div>
          </section>
        </div>
      </main>
      <p className="foot">
        {meta.company} · سري — للاستخدام الداخلي · {meta.preparedBy}
      </p>
    </>
  )
}
