import Header from '@/components/Header'
import { budget, freeTools, meta, payments } from '@/data/status'
import { Money, RECURRING, ar, egp, fmtDate, range, spendTotals, toEgp, usd } from '@/lib/format'

export const dynamic = 'force-dynamic'

const STATUS = {
  paid: { cls: 'ok', text: '✓ مدفوع' },
  approved: { cls: 'ok', text: '✓ معتمد' },
  pending: { cls: 'wait', text: 'بانتظار الاعتماد' },
  free: { cls: 'free', text: 'مجاني' },
} as const

export default function Expenses() {
  const t = spendTotals()
  const rows = [...payments].sort((a, b) => b.date.localeCompare(a.date))
  const maxLine = Math.max(...budget.map((b) => b.monthly[1]))

  return (
    <>
      <Header current="/expenses" title="المصروفات" pdfName="المصروفات" />

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
                        <span className={`chip ${p.reimbursed ? 'ok' : 'wait'}`}>{p.reimbursed ? '✓ تم السداد' : 'مستحق'}</span>
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
                      <span className="chip wait">مستحق {egp(t.owedEgp)}</span>
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
