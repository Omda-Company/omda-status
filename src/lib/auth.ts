/**
 * دخول بباسورد واحد للوحة.
 *
 * الكوكي فيها بصمة (SHA-256) من السر والباسورد، مش الباسورد نفسه. فلو الباسورد
 * أو السر اتغيّر، كل الكوكيز القديمة بتبطل لوحدها. بتشتغل بـ Web Crypto، فتنفع
 * في الـ middleware (edge) وفي الـ route handlers.
 *
 * لو المتغيرات مش متظبطة، اللوحة بتفضل مقفولة. عمرها ما تتفتح من غير باسورد.
 */

export const COOKIE = 'omda_status'
export const MAX_AGE = 60 * 60 * 24 * 30 // 30 يوم

/**
 * بيقبل الاسم بـ OMDA_ في أوله أو من غيرها، عشان اسم مكتوب بطريقة تانية في Vercel ما يقفلش اللوحة.
 * لازم كل اسم يتكتب صريح (process.env.X): الـ middleware بيشتغل على Edge، وهناك الاسم المتركّب
 * (process.env[name]) ما بيتقراش وبيوقّع الـ middleware.
 */
export function config() {
  const password = (process.env.STATUS_PASSWORD || process.env.OMDA_STATUS_PASSWORD || '').trim()
  const secret = (process.env.STATUS_SECRET || process.env.OMDA_STATUS_SECRET || '').trim()
  return { password, secret, ready: password.length > 0 && secret.length >= 16 }
}

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function tokenFor(password: string, secret: string) {
  return sha256(`omda-status:${secret}:${password}`)
}

/** مقارنة بوقت ثابت، عشان التوقيت ما يكشفش أي حاجة عن البصمة. */
export function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
