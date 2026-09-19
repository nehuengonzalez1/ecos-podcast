import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createPreapproval } from '@/lib/mp'
import { setSubscription, getSubscription } from '@/lib/subscriptions'
import { CLERK_ACTIVE, SUSCRIPCION_PUBLICA } from '@/lib/env'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'

export async function POST() {
  if (!CLERK_ACTIVE) return NextResponse.json({ error: 'not-configured' }, { status: 503 })

  // El mismo candado que la pantalla. Esconder el boton no alcanza: sin
  // esto, cualquiera que supiera la direccion podia hacer el POST igual y
  // arrancar una suscripcion que todavia no queremos cobrar.
  if (!(SUSCRIPCION_PUBLICA || (await isAdmin()))) {
    return NextResponse.json({ error: 'not-open' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
  if (!email) return NextResponse.json({ error: 'no-email' }, { status: 400 })

  try {
    const existing = await getSubscription(userId)
    if (existing.active) {
      return NextResponse.json({ error: 'already-subscribed' }, { status: 400 })
    }
    const pre = await createPreapproval(email, userId)
    if (!pre.id) throw new Error('MP no devolvió id de preapproval')
    await setSubscription(userId, {
      active: false,
      preapprovalId: pre.id,
      lastEvent: 'created',
    })
    return NextResponse.json({ id: pre.id, init_point: pre.init_point })
  } catch (e: any) {
    console.error('MP create-preapproval error', e)
    return NextResponse.json({ error: 'mp-error' }, { status: 500 })
  }
}
