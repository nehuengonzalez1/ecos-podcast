import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { aprobar, rechazar, limpiar } from '@/lib/muro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Moderación del muro: aprobar publica, rechazar borra.
 *
 * Nada de lo que entra al muro se ve en público sin pasar antes por acá, que
 * es el punto de toda la moderación: el muro vive en la página de alguien que
 * contó algo difícil, y lo que se publique ahí ya lo leyó una persona.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}) as any)
    const id = limpiar(body?.id, 60)
    const accion = limpiar(body?.accion, 20)

    if (!id || (accion !== 'aprobar' && accion !== 'rechazar')) {
      return NextResponse.json({ error: 'parametros-invalidos' }, { status: 400 })
    }

    if (accion === 'rechazar') {
      await rechazar(id)
      return NextResponse.json({ ok: true, accion })
    }

    const m = await aprobar(id)
    if (!m) return NextResponse.json({ error: 'mensaje-desconocido' }, { status: 404 })

    // Aprobar solo publica. El mensaje no se le reenvía por mail a la persona
    // del episodio: el muro es el lugar donde vive y donde se lo lee.
    return NextResponse.json({ ok: true, accion })
  } catch (e) {
    console.error('[muro] error moderando:', e)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
