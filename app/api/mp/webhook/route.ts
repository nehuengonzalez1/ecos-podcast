import { NextResponse } from 'next/server'
import { getPreapproval } from '@/lib/mp'
import { getUserByPreapproval, getSubscription, setSubscription, logEvent } from '@/lib/subscriptions'
import { validarFirmaMP } from '@/lib/mp-signature'

export const runtime = 'nodejs'

/**
 * Mercado Pago sends webhooks for topic=preapproval when the user
 * authorizes / pauses / cancels the subscription. We validate by
 * fetching the preapproval from MP (single source of truth).
 */
async function process(preapprovalId: string) {
  const pre = await getPreapproval(preapprovalId)
  const userId = pre.external_reference || (await getUserByPreapproval(preapprovalId))
  if (!userId) return { ok: false, reason: 'no-user-mapping' }
  const status = pre.status // "authorized" | "pending" | "paused" | "cancelled"
  const active = status === 'authorized'
  const existing = await getSubscription(userId)
  await setSubscription(userId, {
    active,
    preapprovalId,
    activatedAt: active ? new Date().toISOString() : existing.activatedAt,
    cancelledAt: !active && (status === 'cancelled' || status === 'paused')
      ? new Date().toISOString()
      : existing.cancelledAt,
    lastEvent: status ?? 'unknown',
  })
  // Después de guardar el estado, para no perder el evento si esto falla.
  await logEvent({
    at: new Date().toISOString(),
    userId,
    status: status ?? 'unknown',
    preapprovalId,
    activated: active && !existing.active,
  })
  return { ok: true, status, userId }
}

async function handle(req: Request, exigirFirma: boolean) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const url = new URL(req.url)
    const topic = body?.topic ?? body?.type ?? url.searchParams.get('topic') ?? url.searchParams.get('type')
    const id = body?.data?.id ?? body?.id ?? url.searchParams.get('id') ?? url.searchParams.get('data.id')

    if (topic !== 'preapproval' && topic !== 'subscription_preapproval') {
      return NextResponse.json({ ignored: true, topic })
    }
    if (!id) return NextResponse.json({ error: 'no-id' }, { status: 400 })

    // La firma se valida recién acá: primero descartamos los topics que no
    // nos interesan, para no rechazar por firma algo que igual ignoraríamos.
    if (exigirFirma) {
      const firma = validarFirmaMP(req, String(id))
      if (!firma.valida) {
        if (firma.motivo === 'sin-secreto') {
          // Sin MP_WEBHOOK_SECRET no se puede validar. Seguimos, porque el
          // estado igual se verifica contra la API de MP, pero lo dejamos
          // anotado para que no pase inadvertido.
          console.warn('[mp webhook] MP_WEBHOOK_SECRET sin configurar: firma no validada')
        } else {
          console.error('[mp webhook] firma rechazada:', firma.motivo)
          return NextResponse.json({ error: 'firma-invalida' }, { status: 401 })
        }
      }
    }

    const res = await process(String(id))
    return NextResponse.json(res)
  } catch (e: any) {
    // Log server-side only — never echo internals (they can contain auth headers).
    console.error('MP webhook error', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return handle(req, true)
}

/**
 * MP también pega con GET para verificar que el endpoint existe. Esos
 * pedidos no vienen firmados, así que no se les exige firma: igual no
 * pueden alterar nada, porque el estado se resuelve consultando a MP.
 */
export async function GET(req: Request) {
  return handle(req, false)
}
