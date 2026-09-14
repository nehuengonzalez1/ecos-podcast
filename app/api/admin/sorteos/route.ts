import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { buscarSorteo, estadoDe } from '@/lib/sorteos'
import {
  participantes,
  sortear,
  tiradas,
  participacion,
  SORTEOS_ACTIVOS,
} from '@/lib/participaciones'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Los anotados a un sorteo.
 *
 * Van por una ruta aparte y no con la página para no traer los participantes
 * de todos los sorteos de una: se piden al abrir uno, que es cuando se los
 * mira. Con listas largas, cargarlas todas al entrar al panel sería esperar
 * por datos que casi siempre no se van a ver.
 */
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  const slug = new URL(req.url).searchParams.get('slug') ?? ''
  if (!buscarSorteo(slug)) {
    return NextResponse.json({ error: 'sorteo-desconocido' }, { status: 404 })
  }

  const [anotados, historial] = await Promise.all([participantes(slug), tiradas(slug)])

  // El ganador se resuelve acá y no en el navegador: el panel recibe la
  // persona, no un id que tendría que volver a preguntar.
  const ganador = historial[0] ? await participacion(historial[0].participacionId) : null

  return NextResponse.json({
    ok: true,
    participantes: anotados,
    ganador,
    tiradas: historial.length,
    ultimaTirada: historial[0]?.at ?? null,
  })
}

/** Sortear. */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  if (!SORTEOS_ACTIVOS) {
    return NextResponse.json({ error: 'sin-base' }, { status: 503 })
  }

  try {
    const body = await req.json().catch(() => ({}) as any)
    const slug = String(body?.slug ?? '')
    const sorteo = buscarSorteo(slug)

    if (!sorteo) {
      return NextResponse.json({ error: 'sorteo-desconocido' }, { status: 404 })
    }

    if (body?.accion !== 'sortear') {
      return NextResponse.json({ error: 'accion-desconocida' }, { status: 400 })
    }

    /**
     * No se sortea con el plazo abierto.
     *
     * Con el sorteo todavía en curso, quien se anote después no habría tenido
     * ninguna chance, y eso es exactamente lo que las condiciones publicadas
     * prometen que no pasa. Se espera al cierre.
     */
    if (estadoDe(sorteo) !== 'finalizado') {
      return NextResponse.json({ error: 'todavia-abierto' }, { status: 409 })
    }

    const ganador = await sortear(slug)
    if (!ganador) {
      return NextResponse.json({ error: 'sin-participantes' }, { status: 409 })
    }

    const historial = await tiradas(slug)
    return NextResponse.json({ ok: true, ganador, tiradas: historial.length })
  } catch (e) {
    console.error('[sorteos] error al sortear:', e)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
