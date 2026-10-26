'use client'

/** لو البيانات ما اتحملتش (Supabase واقع أو مش متظبط): رسالة واضحة بدل صفحة بيضا. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="login">
      <div className="login-card">
        <h1>تعذّر تحميل البيانات</h1>
        <p>يُرجى المحاولة مرة أخرى بعد قليل.</p>
        <button className="btn" type="button" onClick={reset}>
          إعادة المحاولة
        </button>
      </div>
    </main>
  )
}
