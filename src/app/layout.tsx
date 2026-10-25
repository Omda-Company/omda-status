import type { Metadata, Viewport } from 'next'
import { Noto_Kufi_Arabic, Readex_Pro } from 'next/font/google'
import './globals.css'

const head = Noto_Kufi_Arabic({ subsets: ['arabic'], weight: ['500', '700'], variable: '--font-head', display: 'swap' })
const body = Readex_Pro({ subsets: ['arabic', 'latin'], weight: ['300', '400', '500', '600'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: 'لوحة متابعة التحول الرقمي — بن العمدة',
  description: 'متابعة الإنجاز والمصروفات والمرحلة الحالية.',
  robots: { index: false, follow: false },
  icons: { icon: '/logo.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4b2e20',
}

/** بيطبّق الثيم المحفوظ قبل الرسم، عشان الصفحة ما تومّضش. */
const themeScript = `try{var t=localStorage.getItem('omda-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${head.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
