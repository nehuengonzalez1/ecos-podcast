import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { buscarEpisodio, refDeEpisodio } from '@/lib/episodios'
import { enviarMensajeAlProtagonista } from '@/lib/mailer'
import { aprobar, rechazar, limpiar, ETIQUETAS } from '@/lib/muro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Moderación del muro: aprobar publica, rechazar borra.
 *
 * Aprobar es el momento en que el mensaje efectivamente le llega al
 * protagonista, no cuando alguien lo escribe. Todo lo que sale por mail
 * desde acá ya pasó por una persona del equipo.
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

    // Se avisa al protagonista solo si el episodio tiene casilla cargada.
    // El mensaje se publica igual: `avisado` es información, no condición.
    let avisado = false
    const ep = buscarEpisodio(m.slug)
    if (ep) {
      avisado = await enviarMensajeAlProtagonista(
        {
          nombre: m.nombre,
          mensaje: m.mensaje,
          etiqueta: ETIQUETAS[m.tipo],
          ...(m.ciudad ? { ciudad: m.ciudad } : {}),
        },
        refDeEpisodio(ep),
      )
    }

    return NextResponse.json({ ok: true, accion, avisado })
  } catch (e) {
    console.error('[muro] error moderando:', e)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
