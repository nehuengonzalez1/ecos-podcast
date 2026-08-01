import { kv } from '@/lib/kv'

export type SubscriptionStatus = {
  active: boolean
  preapprovalId?: string
  activatedAt?: string
  cancelledAt?: string
  lastEvent?: string
}

const key = (userId: string) => `sub:${userId}`
const revKey = (preapprovalId: string) => `pre:${preapprovalId}:user`
const EVENTS_KEY = 'sub:events'

export type SubEvent = {
  at: string
  userId: string
  status: string
  preapprovalId?: string
  /** true cuando el evento representa una alta (paso a activa) */
  activated: boolean
}

/**
 * Registro append-only de cada cambio de suscripción.
 *
 * El estado por usuario (sub:{id}) se sobrescribe en cada webhook, así que
 * por sí solo no permite reconstruir la evolución: cuántas altas hubo el mes
 * pasado, cuánta gente se fue, etc. Esta lista es lo único que guarda esa
 * historia, y no se puede reconstruir hacia atrás.
 */
export async function logEvent(e: SubEvent): Promise<void> {
  if (!kv) return
  try {
    await kv.lpush(EVENTS_KEY, JSON.stringify(e))
  } catch (err) {
    // No romper el webhook por un fallo del registro: el estado del
    // suscriptor es más importante que la métrica.
    console.error('[subs] no se pudo registrar el evento:', err)
  }
}

export async function listEvents(limit = 500): Promise<SubEvent[]> {
  if (!kv) return []
  try {
    const raw = await kv.lrange(EVENTS_KEY, 0, limit - 1)
    return raw
      .map((r) => {
        try { return JSON.parse(r as string) as SubEvent } catch { return null }
      })
      .filter(Boolean) as SubEvent[]
  } catch {
    return []
  }
}

export async function getSubscription(userId: string): Promise<SubscriptionStatus> {
  if (!kv) return { active: false }
  try {
    const v = await kv.get<SubscriptionStatus>(key(userId))
    return v ?? { active: false }
  } catch {
    return { active: false }
  }
}

/**
 * A diferencia de las lecturas, esta falla ruidosamente a propósito: la
 * llama el webhook de Mercado Pago, y si no podemos registrar que alguien
 * pagó preferimos devolver error para que MP reintente, antes que perder
 * el dato en silencio.
 */
export async function setSubscription(userId: string, s: SubscriptionStatus): Promise<void> {
  if (!kv) throw new Error('Redis no configurado: no se puede registrar la suscripción')
  await kv.set(key(userId), s)
  if (s.preapprovalId) {
    await kv.set(revKey(s.preapprovalId), userId)
  }
}

export async function getUserByPreapproval(preapprovalId: string): Promise<string | null> {
  if (!kv) return null
  try {
    return await kv.get<string>(revKey(preapprovalId))
  } catch {
    return null
  }
}

export async function isSubscribed(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const s = await getSubscription(userId)
  return !!s.active
}
