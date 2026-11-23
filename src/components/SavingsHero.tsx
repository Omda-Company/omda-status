'use client'

import { useEffect, useState } from 'react'
import CountUp from '@/components/CountUp'

/**
 * أول حاجة في صفحة المصروفات: اللي وفّرناه، مش اللي صرفناه.
 * الرقم الكبير بيتعد، وفيه تبديل شهري/سنوي، وتحته مقارنة بصرية:
 * شريط صغير لاللي اتصرف، قصاده شريط اللي بيتوفر في سنة.
 */
export default function SavingsHero({ monthlyEgp, spentEgp }: { monthlyEgp: [number, number]; spentEgp: number }) {
  const [mode, setMode] = useState<'month' | 'year'>('month')
  const [go, setGo] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 250)
    return () => clearTimeout(t)
  }, [])

  const k = mode === 'month' ? 1 : 12
  const [lo, hi] = [monthlyEgp[0] * k, monthlyEgp[1] * k]
  const yearLo = monthlyEgp[0] * 12
  const ratio = spentEgp > 0 ? Math.floor(yearLo / spentEgp) : 0
  const spentPct = Math.max(2, Math.min(100, (spentEgp / (monthlyEgp[1] * 12)) * 100))
  const savePct = (yearLo / (monthlyEgp[1] * 12)) * 100

  return (
    <section className={`hero${go ? ' go' : ''}`} aria-labelledby="hero-h">
      <div className="hero-top">
        <p className="hero-eyebrow" id="hero-h">
          ما حققناه للشركة
        </p>
        <div className="seg no-print" role="group" aria-label="عرض الوفر">
          <button type="button" aria-pressed={mode === 'month'} onClick={() => setMode('month')}>
            شهريًا
          </button>
          <button type="button" aria-pressed={mode === 'year'} onClick={() => setMode('year')}>
            خلال عام
          </button>
        </div>
      </div>

      <p className="hero-label">{mode === 'month' ? 'وفر متوقع كل شهر' : 'وفر متوقع خلال عام'}</p>
      <p className="hero-num num" aria-live="polite">
        <CountUp value={lo} kind="num" />
        <span className="hero-dash">–</span>
        <CountUp value={hi} kind="num" delay={120} />
        <span className="hero-cur">ج.م</span>
      </p>
      <p className="hero-sub">
        مقابل <b className="num">{Math.round(spentEgp).toLocaleString('ar-EG')} ج.م</b> فقط صُرفت على المشروع حتى الآن
      </p>

      <div className="vs" aria-hidden>
        <div className="vs-row">
          <span className="vs-name">ما صرفناه</span>
          <span className="vs-bar spend">
            <i style={{ width: go ? `${spentPct}%` : 0 }} />
          </span>
          <span className="vs-val num">{Math.round(spentEgp).toLocaleString('ar-EG')}</span>
        </div>
        <div className="vs-row">
          <span className="vs-name">ما نوفّره في عام</span>
          <span className="vs-bar save">
            <i style={{ width: go ? `${savePct}%` : 0 }} />
            <i className="vs-range" style={{ width: go ? '100%' : 0 }} />
          </span>
          <span className="vs-val num">{Math.round(yearLo).toLocaleString('ar-EG')}+</span>
        </div>
      </div>

      {ratio > 1 && (
        <p className="hero-ratio">
          كل جنيه صُرف يوفّر نحو <b className="num">{ratio.toLocaleString('ar-EG')}</b> جنيهًا خلال عام
        </p>
      )}
      <p className="hero-note">تقدير بالحد الأدنى، وتفاصيل كل بند وطريقة حسابه أدناه.</p>
    </section>
  )
}
