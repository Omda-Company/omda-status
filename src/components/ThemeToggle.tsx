'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const current = (): Theme => {
  const set = document.documentElement.dataset.theme
  if (set === 'dark' || set === 'light') return set
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** زرار فاتح / غامق. الاختيار بيتحفظ على الجهاز، ومن غيره الثيم بيمشي مع إعداد الجهاز. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)
  useEffect(() => setTheme(current()), [])

  const flip = () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('omda-theme', next)
    } catch {}
    setTheme(next)
  }

  return (
    <button type="button" className="ghost" onClick={flip} aria-label="تبديل المظهر">
      {theme === 'dark' ? 'المظهر الفاتح' : 'المظهر الداكن'}
    </button>
  )
}
