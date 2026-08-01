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
