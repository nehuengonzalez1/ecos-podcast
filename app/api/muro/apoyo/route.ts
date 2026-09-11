import { NextResponse } from 'next/server'
import { apoyar, limpiar } from '@/lib/muro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Un corazón sobre un mensaje del muro.
 *
 * No pedimos sesión a propósito: es el gesto más barato que puede hacer
 * alguien que pasa, y ponerle una cuenta adelante lo mata. El navegador
 * recuerda en qué mensajes ya apoyó, que alcanza para que la interfaz sea
 * honesta. Nadie gana nada inflando el contador de un mensaje ajeno.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}) as any)
    const id = limpiar(body?.id, 60)
    if (!id) return NextResponse.json({ error: 'falta-id' }, { status: 400 })

    const apoyos = await apoyar(id)
    if (apoyos === null) {
      return NextResponse.json({ error: 'mensaje-desconocido' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, apoyos })
  } catch {
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
