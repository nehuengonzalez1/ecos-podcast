import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { brand } from '@/lib/config/brand'

// Strip BOM/whitespace defensively — Windows pipelines can inject U+FEFF into env values.
const token = process.env.MP_ACCESS_TOKEN?.replace(/^﻿/, '').trim()
const client = token ? new MercadoPagoConfig({ accessToken: token }) : null

export const mpClient = client
export const preapproval = client ? new PreApproval(client) : null

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export function getPriceArs(): number {
  const v = Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS ?? '1500')
  return Number.isFinite(v) && v > 0 ? v : 1500
}

/**
 * Create a per-user Preapproval (no plan required — inline reason/frequency).
 * Returns { init_point, id } — redirect the user to init_point.
 */
export async function createPreapproval(payerEmail: string, userId: string) {
  if (!preapproval) throw new Error('MP not configured (missing MP_ACCESS_TOKEN)')
  const appUrl = getAppUrl()
  const amount = getPriceArs()
  const res = await preapproval.create({
    body: {
      reason: `${brand.name} · Archivo completo (mensual)`,
      external_reference: userId,
      payer_email: payerEmail,
      back_url: `${appUrl}/cuenta?mp=return`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'ARS',
      },
      status: 'pending',
    },
  })
  return { id: res.id, init_point: res.init_point }
}

export async function getPreapproval(id: string) {
  if (!preapproval) throw new Error('MP not configured')
  return await preapproval.get({ id })
}

export async function cancelPreapproval(id: string) {
  if (!preapproval) throw new Error('MP not configured')
  return await preapproval.update({ id, body: { status: 'cancelled' } })
}

export type MpPreapproval = {
  id: string
  status: string
  external_reference?: string
  date_created?: string
  last_modified?: string
}

/**
 * Lista todas las suscripciones de la cuenta, paginando.
 *
 * Esto es lo que hace recuperable la base de datos: cada preapproval lleva
 * en `external_reference` el id del usuario de Clerk (ver createPreapproval),
 * así que Mercado Pago es de hecho la fuente de verdad y el estado local es
 * una copia acelerada. Si Redis se vacía, se reconstruye desde acá.
 */
export async function searchPreapprovals(): Promise<MpPreapproval[]> {
  if (!preapproval) throw new Error('MP not configured')
  const out: MpPreapproval[] = []
  const limit = 50
  let offset = 0

  // Tope de seguridad: evita un bucle infinito si la API cambia de forma.
  for (let page = 0; page < 40; page++) {
    const res: any = await preapproval.search({ options: { limit, offset } })
    const batch: MpPreapproval[] = res?.results ?? []
    out.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return out
}
