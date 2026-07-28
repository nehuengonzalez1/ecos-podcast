import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSubscription } from '@/lib/subscriptions'
import { CLERK_ACTIVE } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!CLERK_ACTIVE) return NextResponse.json({ active: false, signedIn: false })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ active: false, signedIn: false })
  const s = await getSubscription(userId)
  return NextResponse.json({
    signedIn: true,
    active: s.active,
    preapprovalId: s.preapprovalId ?? null,
    activatedAt: s.activatedAt ?? null,
    cancelledAt: s.cancelledAt ?? null,
    lastEvent: s.lastEvent ?? null,
  })
}
