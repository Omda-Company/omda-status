import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

// خط Cairo للعناوين والنص: واضح، وأوزانه التقيلة (800، و900) للأرقام اللي عايزينها تلفت النظر
const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-cairo', display: 'swap' })

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
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
