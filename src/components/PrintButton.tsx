'use client'

/** تنزيل الصفحة PDF: بيفتح طباعة المتصفح، والصفحة ليها تنسيق طباعة A4 بهوية الشركة. */
export default function PrintButton({ name }: { name: string }) {
  const print = () => {
    const before = document.title
    document.title = `${name}-${new Date().toISOString().slice(0, 10)}`
    window.print()
    setTimeout(() => (document.title = before), 1000)
  }
  return (
    <button type="button" className="ghost" onClick={print}>
      تنزيل PDF
    </button>
  )
}
