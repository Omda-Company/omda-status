import { BRAND as meta } from '@/lib/brand'

export const dynamic = 'force-dynamic'

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  return (
    <main className="login">
      <form className="login-card" method="post" action="/api/login">
        <div className="badge">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="شعار بن العمدة" width={62} height={62} />
        </div>
        <h1>{meta.title}</h1>
        <p>{meta.company} · للاستخدام الداخلي</p>
        <label htmlFor="password" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          كلمة المرور
        </label>
        <input id="password" name="password" type="password" placeholder="كلمة المرور" autoComplete="current-password" required autoFocus />
        {e === '1' && <p className="err">كلمة المرور غير صحيحة.</p>}
        {e === 'setup' && <p className="err">اللوحة غير مهيأة بعد.</p>}
        <button className="btn" type="submit">دخول</button>
      </form>
    </main>
  )
}
