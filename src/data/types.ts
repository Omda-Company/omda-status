/**
 * شكل بيانات اللوحة. البيانات نفسها مش في الريبو (الريبو public):
 * متخزنة في Supabase (جدول dashboard_data، صف key = 'status')، والسيرفر بس هو اللي بيقراها.
 * النسخة اللي بتتعدّل: D:\Al-Omda\data\status\status.json، وبتترفع بـ `npm run push-data`.
 */

export type State = 'done' | 'active' | 'todo'

export type Meta = { title: string; company: string; preparedBy: string; startedAt: string; updatedAt: string }

export type PhaseItem = { title: string; state: State; date?: string }
export type Phase = { id: string; title: string; period: string; summary: string; state: State; items: PhaseItem[] }

export type DayItem = {
  title: string
  result?: string
  figures?: { value: string; label: string }[]
  state: Extract<State, 'done' | 'active'>
}
export type Day = { date: string; items: DayItem[] }

export type SpendStatus = 'paid' | 'approved' | 'pending' | 'free'
export type BudgetItem = { name: string; detail: string; purpose: string; monthly: [number, number]; status: SpendStatus }

/** عملية شراء بالدولار، بسعر صرف يوم الشراء. المقابل بالجنيه = usd × rate */
/** usd × rate = المبلغ بالجنيه. ولو egp موجود، هو المبلغ الفعلي بالجنيه وبيغلب (بند اتدفع بالجنيه، أو مبلغه الفعلي غير الحساب). */
export type Payment = { date: string; item: string; detail?: string; usd?: number; egp?: number; rate: number; recurring: 'monthly' | 'yearly' | 'once' }

/** دفعة سداد من الشركة بالجنيه. بتغطي المشتريات من الأقدم للأحدث. */
export type Reimbursement = { date: string; egp: number; from: string; note?: string }

export type FreeTool = { name: string; use: string; cost: string }

/**
 * بند وفّرناه مقارنةً بتقرير تقدير التكاليف: البديل المكلّف (insteadUsd شهريًا)
 * مقابل اللي عملناه فعلًا (ourUsd شهريًا). الوفر = insteadUsd − ourUsd.
 * term: المصطلح بالإنجليزي (Cloud، Server...)، وexplain: شرحه لغير المتخصص.
 */
export type Saving = {
  item: string
  term?: string
  explain?: string
  instead: string
  /** اختياري: لو مش موجود، البند بيظهر من غير رقم شهري وما بيدخلش في الإجمالي */
  insteadUsd?: [number, number]
  ourWay: string
  ourUsd?: number
  /** تكلفة لمرة واحدة كنص (مثلًا "6,000 ج.م مرة واحدة")، بتظهر بدل ourUsd */
  once?: string
  /** نص الشارة لو مفيش رقم شهري */
  chip?: string
  /** تكلفة لمرة واحدة بالجنيه (للحساب: مدة استرداد التكلفة) */
  onceEgp?: number
  /** البند الأبرز: بيتعرض ككارت كبير لوحده */
  featured?: boolean
  /** الوفر الشهري بالدولار بعد نمو المبيعات */
  growthUsd?: [number, number]
  /** تفصيل الوفر الشهري (مثلًا الصور، والملفات، والصوت) */
  parts?: { name: string; usd: [number, number] }[]
  /** خطوات الحساب، بتظهر تحت "كيف حسبنا" */
  method?: string[]
}
export type Ask = { title: string; detail: string; since: string; state: 'waiting' | 'done' }
export type NextNeed = { title: string; detail: string; cost: string }

export type Status = {
  meta: Meta
  phases: Phase[]
  days: Day[]
  budget: BudgetItem[]
  payments: Payment[]
  reimbursements: Reimbursement[]
  freeTools: FreeTool[]
  /** اختياري: لو مش موجود، قسم الوفر ما بيظهرش */
  savings?: Saving[]
  asks: Ask[]
  nextNeeds: NextNeed[]
}
