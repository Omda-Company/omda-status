'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * رقم بيتعد لقيمته.
 * - أول مرة: من الصفر، أول ما يظهر على الشاشة.
 * - لو القيمة اتغيرت بعدها (زي التبديل شهري/سنوي): بيتحرك من الرقم الحالي للجديد على طول.
 * السيرفر بيرسم القيمة النهائية (فالطباعة ومن غير JavaScript الرقم صح).
 * ومع "تقليل الحركة" في إعدادات الجهاز، الرقم بيظهر ثابت.
 */
const FMT = {
  egp: (n: number) => Math.round(n).toLocaleString('ar-EG') + ' ج.م',
  num: (n: number) => Math.round(n).toLocaleString('ar-EG'),
  usd: (n: number) => '$' + Math.round(n).toLocaleString('en-US'),
} as const

export default function CountUp({ value, kind = 'egp', ms = 1500, delay = 0 }: { value: number; kind?: keyof typeof FMT; ms?: number; delay?: number }) {
  const ref = useRef<HTMLElement>(null)
  const [v, setV] = useState(value)
  const shown = useRef(value)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = value
      setV(value)
      return
    }
    let raf = 0
    let timer = 0
    const animate = (from: number, dur: number) => {
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur)
        const n = from + (value - from) * (1 - Math.pow(1 - p, 3))
        shown.current = n
        setV(n)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    let io: IntersectionObserver | null = null
    if (started.current) {
      animate(shown.current, Math.min(ms, 900))
    } else {
      shown.current = 0
      setV(0)
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io?.disconnect()
          started.current = true
          timer = window.setTimeout(() => animate(0, ms), delay)
        },
        { threshold: 0.3 },
      )
      io.observe(el)
    }

    const done = () => {
      cancelAnimationFrame(raf)
      shown.current = value
      setV(value)
    }
    window.addEventListener('beforeprint', done)
    return () => {
      io?.disconnect()
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      window.removeEventListener('beforeprint', done)
    }
  }, [value, ms, delay])

  const text = FMT[kind](v)
  return kind === 'usd' ? (
    <bdi ref={ref} dir="ltr">
      {text}
    </bdi>
  ) : (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>{text}</span>
  )
}
