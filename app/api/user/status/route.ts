import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSubscription } from '@/lib/subscriptions'
import { isAdmin } from '@/lib/admin'
import { CLERK_ACTIVE } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Estado de la persona que está navegando.
 *
 * Devuelve tres cosas que se parecen pero no son lo mismo, y conviene no
 * mezclarlas:
 *
 *  - `active`: tiene una suscripción paga vigente. Es lo que mira la página
 *    de cuenta para saber si mostrar el estado de la suscripción o la
 *    invitación a suscribirse.
 *  - `admin`: es del equipo.
 *  - `acceso`: puede ver el contenido del Archivo Completo. Es lo único que
 *    mira el candado.
 *
 * `acceso` existe separado a propósito. Quien administra el sitio no paga una
 * suscripción, así que por `active` le daba false y terminaba viendo su
 * propio contenido bloqueado. Resolverlo en el cliente juntando dos flags
 * habría dejado esa decisión repartida; acá es una sola, del lado del
 * servidor, y cualquier candado nuevo la hereda sin tener que acordarse.
 */
export async function GET() {
  if (!CLERK_ACTIVE) {
    return NextResponse.json({ signedIn: false, active: false, admin: false, acceso: false })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ signedIn: false, active: false, admin: false, acceso: false })
  }

  const [s, admin] = await Promise.all([getSubscription(userId), isAdmin()])

  return NextResponse.json({
    signedIn: true,
    active: s.active,
    admin,
    acceso: s.active || admin,
    preapprovalId: s.preapprovalId ?? null,
    activatedAt: s.activatedAt ?? null,
    cancelledAt: s.cancelledAt ?? null,
    lastEvent: s.lastEvent ?? null,
  })
}
