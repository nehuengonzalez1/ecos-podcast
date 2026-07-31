import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { brand } from '@/lib/config/brand'

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
    try {
      await kv.lpush('contact:inbox', JSON.stringify(entry))
    } catch (e) {
      // Sin KV no hay dónde guardar la historia. Antes se respondía ok:true y el
      // mensaje se perdía en silencio: la persona creía que había llegado.
      // Mejor fallar visible y darle una vía alternativa real.
      console.error('[contact] no se pudo persistir el mensaje (KV no disponible)', e)
      return NextResponse.json(
        { error: 'storage-unavailable', contactEmail: brand.emailContact },
        { status: 503 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[contact] error', e)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
