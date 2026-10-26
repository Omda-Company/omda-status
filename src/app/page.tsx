import Link from 'next/link'
import Header from '@/components/Header'
import type { Phase, State } from '@/data/types'
import { getStatus } from '@/lib/data'
import { Money, ar, daysSince, egp, fmtDay, range, spendTotals, usd } from '@/lib/format'

export const dynamic = 'force-dynamic'

/** إنجاز المرحلة: المهمة الخالصة = 1، واللي شغالين فيها = نص. */
const progress = (p: Phase) =>
  Math.round((p.items.reduce((s, i) => s + (i.state === 'done' ? 1 : i.state === 'active' ? 0.5 : 0), 0) / p.items.length) * 100)

const MARK: Record<State, string> = { done: '✓', active: '•', todo: '' }
const PHASE_CHIP: Record<State, { cls: string; text: string }> = {
  done: { cls: 'ok', text: 'مكتملة' },
  active: { cls: 'active', text: 'المرحلة الحالية' },
  todo: { cls: 'free', text: 'لم تبدأ' },
}
const SR = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } as const

export default async function Page() {
  const data = await getStatus()
  const { asks, budget, days, meta, nextNeeds, phases } = data
  const currentIndex = Math.max(0, phases.findIndex((p) => p.state === 'active'))
  const current = phases[currentIndex]
  const pct = progress(current)
  const doneCount = days.reduce((s, d) => s + d.items.filter((i) => i.state === 'done').length, 0)
  const t = spendTotals(data)
  const paidLines = budget.filter((b) => b.status === 'paid' || b.status === 'approved').length
  const sinceStart = daysSince(meta.startedAt) + 1
  const waiting = asks.filter((a) => a.state === 'waiting')

  return (
    <>
      <Header meta={meta} current="/" title={meta.title} pdfName="لوحة-متابعة-التحول" />

      <main className="wrap">
        <section className="stats" aria-label="ملخص">
          <div className="stat">
            <span className="stat-label">المرحلة الحالية</span>
            <span className="stat-value num">
              {ar(currentIndex + 1)} من {ar(phases.length)}
            </span>
            <span className="stat-sub">{current.title}</span>
          </div>
          <div className="stat">
            <span className="stat-label">إنجاز المرحلة الحالية</span>
            <span className="stat-value num">{ar(pct)}٪</span>
            <span className="stat-sub">
              {ar(current.items.filter((i) => i.state === 'done').length)} من {ar(current.items.length)} مهام مكتملة
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">إنجازات مكتملة</span>
            <span className="stat-value num">{ar(doneCount)}</span>
            <span className="stat-sub">خلال {ar(sinceStart)} يومًا من البدء</span>
          </div>
          <div className="stat">
            <span className="stat-label">المصروف حتى الآن</span>
            <span className="stat-value num">{egp(t.totalEgp)}</span>
            <span className="stat-sub num">
              <Money>{usd(t.totalUsd)}</Money> بسعر صرف يوم الشراء
            </span>
          </div>
        </section>

        <section className="panel" aria-labelledby="phases-h">
          <div className="panel-h">
            <h2 id="phases-h">مراحل العمل</h2>
            <p>تُفتح كل مرحلة بعد اكتمال التي قبلها.</p>
          </div>
          <div className="panel-b">
            <ol className="track" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {phases.map((p, i) => {
                const chip = PHASE_CHIP[p.state]
                const ppct = progress(p)
                return (
                  <li key={p.id} className={`phase ${p.state}`} aria-current={p.state === 'active' ? 'step' : undefined}>
                    <div className="phase-top">
                      <span className="phase-no">المرحلة {ar(i + 1)}</span>
                      <span className={`chip ${chip.cls}`}>
                        {p.state === 'todo' ? '🔒 ' : ''}
                        {chip.text}
                      </span>
                    </div>
                    <h3>{p.title}</h3>
                    <p className="phase-period">{ar(p.period)}</p>
                    <p className="phase-sum">{ar(p.summary)}</p>
                    {p.state !== 'todo' && (
                      <>
                        <div className="bar" role="progressbar" aria-valuenow={ppct} aria-valuemin={0} aria-valuemax={100} aria-label={`إنجاز ${p.title}`}>
                          <span style={{ width: `${ppct}%` }} />
                        </div>
                        <div className="bar-row num">
                          <span>الإنجاز</span>
                          <span>{ar(ppct)}٪</span>
                        </div>
                      </>
                    )}
                    <ul className="items">
                      {p.items.map((it) => (
                        <li key={it.title} className={it.state}>
                          <span className={`mark ${it.state}`} aria-hidden>
                            {MARK[it.state]}
                          </span>
                          <span>
                            {ar(it.title)}
                            <span style={SR}>{it.state === 'done' ? ' (مكتملة)' : it.state === 'active' ? ' (قيد التنفيذ)' : ' (لم تبدأ)'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        <div className="cols">
          <section className="panel" aria-labelledby="days-h">
            <div className="panel-h">
              <h2 id="days-h">سجل العمل اليومي</h2>
              <p>من الأحدث إلى الأقدم</p>
            </div>
            <div className="panel-b">
              <ol className="days">
                {days.map((d) => (
                  <li key={d.date} className="day">
                    <div className="day-h">
                      <span className="day-dot" aria-hidden />
                      <h3 className="num">{fmtDay(d.date)}</h3>
                      <span className="day-count num">
                        {ar(d.items.length)} {d.items.length === 1 ? 'إنجاز' : 'إنجازات'}
                      </span>
                    </div>
                    <ul className="day-items">
                      {d.items.map((a) => (
                        <li key={a.title} className="ach">
                          <div className="ach-top">
                            <h4>{ar(a.title)}</h4>
                            <span className={`chip ${a.state === 'done' ? 'ok' : 'active'}`}>{a.state === 'done' ? '✓ مكتمل' : 'قيد التنفيذ'}</span>
                          </div>
                          {a.result && <p>{ar(a.result)}</p>}
                          {a.figures && (
                            <div className="figs">
                              {a.figures.map((f) => (
                                <span key={f.label} className="fig num">
                                  <b>{f.value.includes('$') ? <Money>{f.value}</Money> : ar(f.value)}</b>
                                  {f.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <div className="stack">
            <section className="panel" aria-labelledby="money-h">
              <div className="panel-h">
                <h2 id="money-h">المصروفات</h2>
                <Link href="/expenses" className="more no-print">
                  التفاصيل ←
                </Link>
              </div>
              <div className="panel-b">
                <div className="money num">
                  <div>
                    <span>المدفوع حتى الآن</span>
                    <b>{egp(t.totalEgp)}</b>
                    <small>
                      <Money>{usd(t.totalUsd)}</Money>
                    </small>
                  </div>
                  <div>
                    <span>مستحق السداد</span>
                    <b>{egp(t.owedEgp)}</b>
                    <small>بسعر يوم الشراء</small>
                  </div>
                  <div>
                    <span>المطلوب شهريًا</span>
                    <b>
                      <Money>{range(t.requested)}</Money>
                    </b>
                    <small>{ar(paidLines)} من {ar(budget.length)} بنود مفعّلة</small>
                  </div>
                </div>
                <p className="note">كل عملية شراء مسجلة بسعر الدولار يوم شرائها. التفاصيل الكاملة في صفحة المصروفات.</p>
              </div>
            </section>

            <section className="panel" aria-labelledby="asks-h">
              <div className="panel-h">
                <h2 id="asks-h">المطلوب من الإدارة</h2>
                <p>{waiting.length ? `${ar(waiting.length)} بنود بانتظار الرد` : 'لا توجد بنود معلقة'}</p>
              </div>
              <div className="panel-b">
                <ul className="asks">
                  {asks.map((a) => (
                    <li key={a.title}>
                      <div className="row">
                        <b>{a.title}</b>
                        <span className={`chip ${a.state === 'done' ? 'ok' : 'wait'} num`}>
                          {a.state === 'done' ? '✓ تم' : daysSince(a.since) === 0 ? 'مطلوب اليوم' : `منذ ${ar(daysSince(a.since))} يوم`}
                        </span>
                      </div>
                      <p>{ar(a.detail)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="panel" aria-labelledby="next-h">
              <div className="panel-h">
                <h2 id="next-h">الخطوة التالية</h2>
                <p>{phases[currentIndex + 1]?.title ?? ''}</p>
              </div>
              <div className="panel-b">
                <ul className="asks">
                  {nextNeeds.map((n) => (
                    <li key={n.title}>
                      <div className="row">
                        <b>{n.title}</b>
                        <span className="chip free">{n.cost}</span>
                      </div>
                      <p>{ar(n.detail)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
      <p className="foot">
        {meta.company} · سري — للاستخدام الداخلي · {meta.preparedBy}
      </p>
    </>
  )
}
