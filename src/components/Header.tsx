import Link from 'next/link'
import PrintButton from '@/components/PrintButton'
import ThemeToggle from '@/components/ThemeToggle'
import type { Meta } from '@/data/types'
import { fmtDate } from '@/lib/format'

const PAGES = [
  { href: '/', label: 'المتابعة' },
  { href: '/expenses', label: 'المصروفات' },
]

export default function Header({ meta, current, title, pdfName }: { meta: Meta; current: string; title: string; pdfName: string }) {
  return (
    <header className="band">
      <div className="wrap">
        <div className="badge">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="شعار بن العمدة" width={62} height={62} />
        </div>
        <div className="band-text">
          <p className="eyebrow">{meta.company} · سري — للإدارة</p>
          <h1>{title}</h1>
          <div className="band-meta">
            <span>
              إعداد: <b>{meta.preparedBy}</b>
            </span>
            <span>
              آخر تحديث: <b>{fmtDate(meta.updatedAt)}</b>
            </span>
          </div>
        </div>
        <div className="band-tools no-print">
          <nav className="tabs" aria-label="صفحات اللوحة">
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="tab" aria-current={p.href === current ? 'page' : undefined}>
                {p.label}
              </Link>
            ))}
          </nav>
          <div className="band-btns">
            <PrintButton name={pdfName} />
            <ThemeToggle />
            <form method="post" action="/api/logout">
              <button className="ghost" type="submit">
                خروج
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
