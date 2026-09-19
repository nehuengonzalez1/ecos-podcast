import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { SORTEOS_PUBLICOS } from '@/lib/env'
import { buscarSorteo, estadoDe } from '@/lib/sorteos'
import { limpiar } from '@/lib/muro-publico'
import {
  anotar,
  yaParticipo,
  dentroDelLimite,
  SORTEOS_ACTIVOS,
} from '@/lib/participaciones'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Detrás de Vercel el cliente real es el primero de la cadena. */
function ipDe(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? ''
}

function emailValido(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

/**
 * Anotarse a un sorteo.
 *
 * El estado se vuelve a calcular acá y no se confía en lo que diga el
 * navegador: la página pudo haber quedado abierta desde antes del cierre, y
 * aceptar esa participación sería dejar entrar a alguien fuera de plazo.
 */
export async function POST(req: Request) {
  // El mismo candado que la pantalla. Esconder el formulario no alcanza:
  // quien supiera la direccion podia anotarse igual a un sorteo que todavia
  // no es publico.
  if (!(SORTEOS_PUBLICOS || (await isAdmin()))) {
    return NextResponse.json({ error: 'not-open' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}) as any)

    // Campo trampa: invisible en el formulario, así que solo lo completa un
    // bot. Se responde ok para no enseñarle que fue detectado.
    if (limpiar(body?.web, 50)) {
      return NextResponse.json({ ok: true })
    }

    const slug = limpiar(body?.slug, 120)
    const sorteo = await buscarSorteo(slug)
    if (!sorteo) {
      return NextResponse.json({ error: 'sorteo-desconocido' }, { status: 404 })
    }

    const estado = estadoDe(sorteo)
    if (estado !== 'activo') {
      return NextResponse.json({ error: `sorteo-${estado}` }, { status: 409 })
    }

    const nombre = limpiar(body?.nombre, 80)
    const email = limpiar(body?.email, 120).toLowerCase()
    const instagram = limpiar(body?.instagram, 60).replace(/^@+/, '')
    const ciudad = limpiar(body?.ciudad, 80)
    const acepta = body?.acepta === true

    if (nombre.length < 2) {
      return NextResponse.json({ error: 'falta-nombre' }, { status: 400 })
    }
    if (!emailValido(email)) {
      return NextResponse.json({ error: 'email-invalido' }, { status: 400 })
    }
    if (!ciudad) {
      return NextResponse.json({ error: 'falta-ciudad' }, { status: 400 })
    }
    // Las condiciones se aceptan en serio: es lo que ata la participación a
    // las reglas publicadas, así que sin eso no se guarda nada.
    if (!acepta) {
      return NextResponse.json({ error: 'faltan-condiciones' }, { status: 400 })
    }

    if (!SORTEOS_ACTIVOS) {
      return NextResponse.json({ error: 'sorteos-inactivos' }, { status: 503 })
    }

    if (!(await dentroDelLimite(ipDe(req)))) {
      return NextResponse.json({ error: 'demasiados-intentos' }, { status: 429 })
    }

    if (await yaParticipo(slug, email)) {
      return NextResponse.json({ error: 'ya-participaste' }, { status: 409 })
    }

    const guardado = await anotar({
      slug,
      nombre,
      email,
      ciudad,
      ...(instagram ? { instagram } : {}),
    })
    if (!guardado) {
      return NextResponse.json({ error: 'no-se-pudo-guardar' }, { status: 503 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[sorteos] error al anotar una participación:', e)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
