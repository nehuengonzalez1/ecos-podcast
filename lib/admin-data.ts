import { clerkClient } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'
import { getPriceArs } from '@/lib/mp'
import { listEvents, type SubEvent } from '@/lib/subscriptions'

export type Suscriptor = {
  userId: string
  nombre: string
  email: string
  avatar?: string
  active: boolean
  preapprovalId?: string
  activatedAt?: string
  cancelledAt?: string
  lastEvent?: string
  /** Alta en el sitio (Clerk), no en la suscripción */
  registradoAt?: string
  ultimoIngresoAt?: string
  /** Días como suscriptor activo. null si nunca se activó. */
  diasSuscripto: number | null
}

type SubRecord = {
  active: boolean
  preapprovalId?: string
  activatedAt?: string
  cancelledAt?: string
  lastEvent?: string
}

function dias(desde?: string): number | null {
  if (!desde) return null
  const t = new Date(desde).getTime()
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

/**
 * Junta el estado de suscripción (Redis) con la identidad (Clerk).
 *
 * Redis solo guarda el id de Clerk, que es opaco (`user_2ab…`) y no sirve
 * para reconocer a nadie. Los nombres y emails viven en Clerk, así que hay
 * que cruzarlos acá.
 */
export async function cargarSuscriptores(): Promise<Suscriptor[]> {
  if (!kv) return []

  let keys: string[] = []
  try {
    keys = await kv.keys('sub:*')
  } catch {
    return []
  }
  // 'sub:events' comparte prefijo con los usuarios pero es la lista de
  // eventos, no un suscriptor.
  const userIds = keys.map((k) => k.slice(4)).filter((id) => id && id !== 'events')
  if (userIds.length === 0) return []

  const registros = await Promise.all(
    userIds.map(async (id) => [id, await kv!.get<SubRecord>(`sub:${id}`)] as const),
  )

  // Una sola llamada a Clerk para todos, en vez de una por suscriptor.
  const perfiles = new Map<string, any>()
  try {
    const client = await clerkClient()
    const lista = await client.users.getUserList({ userId: userIds, limit: 500 })
    for (const u of lista.data) perfiles.set(u.id, u)
  } catch (e) {
    // Sin Clerk mostramos igual los datos de suscripción, con el id crudo.
    console.error('[admin] no se pudieron traer los perfiles de Clerk:', e)
  }

  const out: Suscriptor[] = []
  for (const [userId, rec] of registros) {
    if (!rec) continue
    const u = perfiles.get(userId)
    const email =
      u?.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)?.emailAddress ??
      u?.emailAddresses?.[0]?.emailAddress ??
      ''
    const nombre =
      [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
      u?.username ||
      email.split('@')[0] ||
      userId

    out.push({
      userId,
      nombre,
      email,
      avatar: u?.imageUrl,
      active: !!rec.active,
      preapprovalId: rec.preapprovalId,
      activatedAt: rec.activatedAt,
      cancelledAt: rec.cancelledAt,
      lastEvent: rec.lastEvent,
      registradoAt: u?.createdAt ? new Date(u.createdAt).toISOString() : undefined,
      ultimoIngresoAt: u?.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : undefined,
      diasSuscripto: rec.active ? dias(rec.activatedAt) : null,
    })
  }

  // Activos primero; dentro de cada grupo, los más antiguos arriba.
  out.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return (a.activatedAt ?? '').localeCompare(b.activatedAt ?? '')
  })
  return out
}

export type Metricas = {
  totalRegistrados: number
  activos: number
  cancelados: number
  ingresoMensual: number
  precio: number
  antiguedadPromedio: number | null
  altasUltimos30: number
  bajasUltimos30: number
  eventos: SubEvent[]
}

export async function calcularMetricas(subs: Suscriptor[]): Promise<Metricas> {
  const precio = getPriceArs()
  const activos = subs.filter((s) => s.active)
  const eventos = await listEvents(500)

  const hace30 = Date.now() - 30 * 86_400_000
  const recientes = eventos.filter((e) => new Date(e.at).getTime() >= hace30)

  const antiguedades = activos.map((s) => s.diasSuscripto).filter((d): d is number => d !== null)

  return {
    totalRegistrados: subs.length,
    activos: activos.length,
    cancelados: subs.filter((s) => !s.active && s.cancelledAt).length,
    ingresoMensual: activos.length * precio,
    precio,
    antiguedadPromedio: antiguedades.length
      ? Math.round(antiguedades.reduce((a, b) => a + b, 0) / antiguedades.length)
      : null,
    altasUltimos30: recientes.filter((e) => e.activated).length,
    bajasUltimos30: recientes.filter((e) => e.status === 'cancelled' || e.status === 'paused').length,
    eventos,
  }
}
