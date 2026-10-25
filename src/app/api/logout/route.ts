import { NextResponse } from 'next/server'
import { COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = new NextResponse(null, { status: 303, headers: { Location: '/login', 'Cache-Control': 'no-store' } })
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
