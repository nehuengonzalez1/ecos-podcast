import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { buscarEpisodio } from '@/lib/episodios'
import { CAMPOS_EDITABLES, CONTENIDO_ACTIVO, guardar, restaurar, type Override } from '@/lib/contenido'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Guardado de las ediciones de contenido.
 *
 * Solo se aceptan los campos de CAMPOS_EDITABLES. Todo lo demas que venga en
 * el cuerpo se descarta en silencio: sin ese filtro, quien tenga acceso al
 * panel podria escribir claves arbitrarias en el episodio, y el `id` y el
 * `slug` -- que son con lo que el muro y las URLs identifican al episodio --
 * tienen que quedar fuera del alcance de una edicion.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  if (!CONTENIDO_ACTIVO) {
    return NextResponse.json(
      { error: 'sin-base', detalle: 'Las ediciones se guardan en Redis y no está conectado.' },
      { status: 503 },
    )
  }

  try {
    const body = await req.json().catch(() => ({}) as any)
    const slug = String(body?.slug ?? '')

    if (!buscarEpisodio(slug)) {
      return NextResponse.json({ error: 'episodio-desconocido' }, { status: 404 })
    }

    if (body?.accion === 'restaurar') {
      await restaurar(slug)
      return NextResponse.json({ ok: true, override: {} })
    }

    const cambios: Override = {}
    for (const campo of CAMPOS_EDITABLES) {
      if (campo in (body?.campos ?? {})) cambios[campo] = body.campos[campo]
    }

    const override = await guardar(slug, cambios)
    return NextResponse.json({ ok: true, override })
  } catch (e: any) {
    console.error('[contenido] no se pudo guardar:', e)
    return NextResponse.json({ error: 'error', detalle: e?.message }, { status: 500 })
  }
}
