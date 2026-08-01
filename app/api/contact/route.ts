import { NextResponse } from 'next/server'
import { kv, kvSource } from '@/lib/kv'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nombre = String(body?.nombre ?? '').slice(0, 200)
    const email = String(body?.email ?? '').slice(0, 200)
    const instagram = String(body?.instagram ?? '').slice(0, 200)
    const ubicacion = String(body?.ubicacion ?? '').slice(0, 200)
    const historia = String(body?.historia ?? '').slice(0, 5000)
    const motivo = String(body?.motivo ?? '').slice(0, 2000)
    const notas = String(body?.notas ?? '').slice(0, 2000)
    const origen = String(body?.origen ?? '').slice(0, 100)
    if (!nombre || !email || !historia) {
      return NextResponse.json({ error: 'missing-fields' }, { status: 400 })
    }
    const entry = {
      nombre,
      email,
      instagram,
      ubicacion,
      historia,
      motivo,
      notas,
      origen,
      at: new Date().toISOString(),
    }
    // `stored` viaja en la respuesta para poder diagnosticar desde afuera si
    // el mensaje se persistió. Sin esto, un fallo de Redis es invisible: la
    // API respondía ok igual y el mensaje se perdía sin dejar rastro.
    let stored = false
    try {
      if (!kv) throw new Error(`Redis ${kvSource()}`)
      await kv.lpush('contact:inbox', JSON.stringify(entry))
      stored = true
    } catch (e) {
      // No fallamos la operación del usuario por un problema de infraestructura,
      // pero lo dejamos en los logs con el detalle para poder rastrearlo.
      console.error('[contact] no se pudo guardar el mensaje:', kvSource(), e, entry)
    }
    return NextResponse.json({ ok: true, stored })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 })
  }
}
