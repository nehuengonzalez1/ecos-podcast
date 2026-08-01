import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { searchPreapprovals } from '@/lib/mp'
import { getSubscription, setSubscription } from '@/lib/subscriptions'
import { KV_ACTIVE } from '@/lib/kv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Reconstruye el estado de las suscripciones consultando a Mercado Pago.
 *
 * Sirve para dos cosas:
 *  - Recuperar la base si Redis se vació (el plan gratuito no persiste).
 *  - Reparar el estado si algún webhook se perdió.
 *
 * MP es la fuente de verdad: cada preapproval trae en external_reference el
 * id del usuario de Clerk, así que la tabla local es reconstruible entera.
 */
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }
  if (!KV_ACTIVE) {
    return NextResponse.json({ error: 'sin-base-de-datos' }, { status: 503 })
  }

  try {
    const preapprovals = await searchPreapprovals()
    let revisados = 0
    let actualizados = 0
    let sinUsuario = 0

    for (const p of preapprovals) {
      revisados++
      const userId = p.external_reference
      if (!userId) {
        // Suscripción creada por fuera del sitio: no sabemos de quién es.
        sinUsuario++
        continue
      }
      const active = p.status === 'authorized'
      const previo = await getSubscription(userId)
      if (previo.active === active && previo.preapprovalId === p.id) continue

      await setSubscription(userId, {
        active,
        preapprovalId: p.id,
        activatedAt: active ? (previo.activatedAt ?? p.date_created) : previo.activatedAt,
        cancelledAt: !active ? (previo.cancelledAt ?? p.last_modified) : previo.cancelledAt,
        lastEvent: p.status,
      })
      actualizados++
    }

    return NextResponse.json({ ok: true, revisados, actualizados, sinUsuario })
  } catch (e: any) {
    console.error('[resync] error:', e)
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 })
  }
}
