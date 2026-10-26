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
export type Payment = { date: string; item: string; detail?: string; usd: number; rate: number; recurring: 'monthly' | 'yearly' | 'once' }

/** دفعة سداد من الشركة بالجنيه. بتغطي المشتريات من الأقدم للأحدث. */
export type Reimbursement = { date: string; egp: number; from: string; note?: string }

export type FreeTool = { name: string; use: string; cost: string }
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
  asks: Ask[]
  nextNeeds: NextNeed[]
}
