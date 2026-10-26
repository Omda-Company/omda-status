import Header from '@/components/Header'
import { getStatus } from '@/lib/data'
import { Money, RECURRING, ar, egp, fmtDate, range, saved, savingTotals, settlement, spendTotals, toEgp, usd } from '@/lib/format'

export const dynamic = 'force-dynamic'

const STATUS = {
  paid: { cls: 'ok', text: '✓ مدفوع' },
  approved: { cls: 'ok', text: '✓ معتمد' },
  pending: { cls: 'wait', text: 'بانتظار الاعتماد' },
  free: { cls: 'free', text: 'مجاني' },
} as const

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

  return (
    <>
      <Header meta={meta} current="/expenses" title="المصروفات" pdfName="المصروفات" />

      <main className="wrap">
        <section className="stats" aria-label="ملخص المصروفات">
          <div className="stat">
            <span className="stat-label">إجمالي المدفوع بالدولار</span>
            <span className="stat-value num">
              <Money>{usd(t.totalUsd)}</Money>
            </span>
            <span className="stat-sub num">{ar(payments.length)} عمليات شراء</span>
          </div>
          <div className="stat">
            <span className="stat-label">المقابل بالجنيه</span>
            <span className="stat-value num">{egp(t.totalEgp)}</span>
            <span className="stat-sub">بسعر صرف يوم كل عملية</span>
          </div>
          <div className="stat">
            <span className="stat-label">تم سداده</span>
            <span className="stat-value num">{egp(t.paidBackEgp)}</span>
            <span className="stat-sub">بالجنيه المصري</span>
          </div>
          <div className="stat stat-alert">
            <span className="stat-label">مستحق السداد</span>
            <span className="stat-value num">{egp(t.owedEgp)}</span>
            <span className="stat-sub">بالجنيه المصري</span>
          </div>
        </section>

        {savings.length > 0 && (
          <section className="panel save-panel" aria-labelledby="save-h">
            <div className="panel-h">
              <h2 id="save-h">ما وفّرناه للشركة</h2>
              <p>مقارنةً بتقرير تقدير التكاليف ({ar('20 أكتوبر 2026')})</p>
            </div>
            <div className="panel-b">
              <div className="money num">
                <div>
                  <span>الوفر شهريًا</span>
                  <b>
                    <Money>{range(sv.monthly)}</Money>
                  </b>
                </div>
                {t.refRate > 0 && (
                  <div>
                    <span>تقديريًا بالجنيه</span>
                    <b>{range(sv.monthly.map((n) => n * t.refRate) as [number, number], egp)}</b>
                  </div>
                )}
                <div>
                  <span>الوفر المتوقع خلال عام</span>
                  <b>
                    <Money>{range(sv.yearly)}</Money>
                  </b>
                </div>
              </div>

              <ul className="saves">
                {savings.map((s) => (
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
                        وفر <Money>{range(saved(s))}</Money> شهريًا
                      </span>
                    </div>
                    {s.explain && <p className="save-explain">{s.explain}</p>}
                    <div className="save-cmp num">
                      <span className="save-was">
                        <small>بدلًا من</small>
                        <s>
                          {s.instead} · <Money>{range(s.insteadUsd)}</Money>
                        </s>
                      </span>
                      <span className="save-now">
                        <small>ما فعلناه</small>
                        {s.ourWay} · <Money>{s.ourUsd > 0 ? usd(s.ourUsd) : '$0'}</Money>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {t.refRate > 0 && (
                <p className="note">
                  الوفر = تكلفة البديل في التقرير − ما يُدفع فعليًا، شهريًا. والتقدير بالجنيه بسعر آخر عملية شراء ({ar(t.refRate)} ج.م للدولار).
                </p>
              )}
            </div>
          </section>
        )}

        <section className="panel" aria-labelledby="buys-h">
          <div className="panel-h">
            <h2 id="buys-h">عمليات الشراء</h2>
            <p>تُدفع بالدولار وتُسدَّد بالجنيه بسعر صرف يوم الشراء</p>
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
                      <td>
                        <Money>{usd(p.usd)}</Money>
                      </td>
                      <td>{ar(p.rate)} ج.م</td>
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
              المبلغ بالجنيه = المبلغ بالدولار × سعر الدولار يوم الشراء. والاشتراكات الشهرية تُسجَّل عملية جديدة عند كل تجديد بسعر يومها.
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
