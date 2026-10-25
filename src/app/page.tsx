import ThemeToggle from '@/components/ThemeToggle'
import {
  achievements,
  asks,
  budget,
  freeTools,
  meta,
  nextNeeds,
  payments,
  phases,
  type Phase,
  type State,
} from '@/data/status'

export const dynamic = 'force-dynamic'

const AR = '٠١٢٣٤٥٦٧٨٩'
/** أرقام عربية في النص العربي، والمبالغ بالدولار تفضل بالأرقام الغربية زي ما بتتكتب عادة. */
const ar = (v: string | number) => {
  const s = String(v)
  return s.includes('$') ? s : s.replace(/\d/g, (d) => AR[Number(d)])
}
/** مبلغ بالدولار: اتجاهه ثابت من الشمال لليمين، عشان "40 – 60" ما يتقريش مقلوب جوه النص العربي. */
const Money = ({ children }: { children: React.ReactNode }) => (
  <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>
    {children}
  </bdi>
)
const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00+02:00').getTime()) / 86_400_000))
const usd = (n: number) => '$' + n.toLocaleString('en-US')
const range = ([a, b]: [number, number]) => (a === b ? usd(a) : `${usd(a)} – ${usd(b)}`)

/** إنجاز المرحلة: المهمة الخالصة = 1، واللي شغالين فيها = نص. */
const progress = (p: Phase) =>
  Math.round((p.items.reduce((s, i) => s + (i.state === 'done' ? 1 : i.state === 'active' ? 0.5 : 0), 0) / p.items.length) * 100)

const MARK: Record<State, string> = { done: '✓', active: '•', todo: '' }
const PHASE_CHIP: Record<State, { cls: string; text: string }> = {
  done: { cls: 'ok', text: 'مكتملة' },
  active: { cls: 'active', text: 'المرحلة الحالية' },
  todo: { cls: 'free', text: 'لم تبدأ' },
}

export default function Page() {
  const currentIndex = Math.max(0, phases.findIndex((p) => p.state === 'active'))
  const current = phases[currentIndex]
  const pct = progress(current)
  const doneCount = achievements.filter((a) => a.state === 'done').length
  const spent = payments.reduce((s, p) => s + p.amount, 0)
  const approved = budget.filter((b) => b.status === 'approved')
  const approvedMax = approved.reduce((s, b) => s + b.monthly[1], 0)
  const requested: [number, number] = [budget.reduce((s, b) => s + b.monthly[0], 0), budget.reduce((s, b) => s + b.monthly[1], 0)]
  const maxLine = Math.max(...budget.map((b) => b.monthly[1]))
  const days = daysSince(meta.startedAt) + 1
  const waiting = asks.filter((a) => a.state === 'waiting')

  return (
    <>
      <header className="band">
        <div className="wrap">
          <div className="badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="شعار بن العمدة" width={62} height={62} />
          </div>
          <div className="band-text">
            <p className="eyebrow">{meta.company} · سري — للإدارة</p>
            <h1>{meta.title}</h1>
            <div className="band-meta">
              <span>
                إعداد: <b>{meta.preparedBy}</b>
              </span>
              <span>
                آخر تحديث: <b>{fmtDate(meta.updatedAt)}</b>
              </span>
            </div>
          </div>
          <div className="band-tools">
            <ThemeToggle />
            <form method="post" action="/api/logout">
              <button className="ghost" type="submit">
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>

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
            <span className="stat-sub">خلال {ar(days)} يومًا من البدء</span>
          </div>
          <div className="stat">
            <span className="stat-label">المصروف من ميزانية الشركة</span>
            <span className="stat-value num"><Money>{usd(spent)}</Money></span>
            <span className="stat-sub">{approved.length ? <>المعتمد شهريًا حتى <Money>{usd(approvedMax)}</Money></> : 'لم تُعتمد الميزانية بعد'}</span>
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
                      <span className={`chip ${chip.cls}`}>{p.state === 'todo' ? '🔒 ' : ''}{chip.text}</span>
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
                            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                              {it.state === 'done' ? ' (مكتملة)' : it.state === 'active' ? ' (قيد التنفيذ)' : ' (لم تبدأ)'}
                            </span>
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
          <section className="panel" aria-labelledby="ach-h">
            <div className="panel-h">
              <h2 id="ach-h">ما تم إنجازه</h2>
              <p>من الأحدث إلى الأقدم</p>
            </div>
            <div className="panel-b">
              <ol className="feed">
                {achievements.map((a) => (
                  <li key={a.date + a.title} className="ach">
                    <span className="ach-date num">{fmtDate(a.date)}</span>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <h3>{a.title}</h3>
                        <span className={`chip ${a.state === 'done' ? 'ok' : 'active'}`}>{a.state === 'done' ? '✓ مكتمل' : 'قيد التنفيذ'}</span>
                      </div>
                      <p>{ar(a.result)}</p>
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
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <div className="stack">
            <section className="panel" aria-labelledby="money-h">
              <div className="panel-h">
                <h2 id="money-h">الميزانية والمصروفات</h2>
                <p>بالدولار الأمريكي</p>
              </div>
              <div className="panel-b">
                <div className="money num">
                  <div>
                    <span>المصروف فعليًا</span>
                    <b><Money>{usd(spent)}</Money></b>
                  </div>
                  <div>
                    <span>المعتمد شهريًا</span>
                    <b><Money>{usd(approvedMax)}</Money></b>
                  </div>
                  <div>
                    <span>المطلوب شهريًا</span>
                    <b><Money>{range(requested)}</Money></b>
                  </div>
                </div>
                <h3 className="sub-h">بنود الميزانية المطلوبة</h3>
                <ul className="lines">
                  {budget.map((b) => (
                    <li key={b.name} className="line" title={b.purpose}>
                      <div className="line-top">
                        <span>
                          {b.name} <small>· {ar(b.detail)}</small>
                        </span>
                        <span className="num" style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                          <Money>{range(b.monthly)}</Money>
                          <span className={`chip ${b.status === 'approved' ? 'ok' : b.status === 'free' ? 'free' : 'wait'}`}>
                            {b.status === 'approved' ? '✓ معتمد' : b.status === 'free' ? 'مجاني' : 'بانتظار الاعتماد'}
                          </span>
                        </span>
                      </div>
                      <div className="line-bar" aria-hidden>
                        <span style={{ width: `${(b.monthly[1] / maxLine) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
                <h3 className="sub-h">أُنجز حتى الآن بأدوات مجانية</h3>
                <ul className="free-list">
                  {freeTools.map((t) => (
                    <li key={t.name}>
                      <span>
                        {t.name} <small>· {t.use}</small>
                      </span>
                      <small className="num">{ar(t.cost)}</small>
                    </li>
                  ))}
                </ul>
                <p className="note">الأرقام من تقرير تقدير التكاليف ({ar('20 أكتوبر 2026')}). وأي مشروع جديد يُعرض له تقدير مستقل قبل البدء.</p>
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
