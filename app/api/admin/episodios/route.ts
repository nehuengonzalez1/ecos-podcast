import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { buscarEpisodio, buscarEnArchivo, episodiosDelArchivo } from '@/lib/episodios'
import {
  CAMPOS_EDITABLES,
  CONTENIDO_ACTIVO,
  guardar,
  restaurar,
  crearEpisodio,
  borrarEpisodio,
  type Override,
} from '@/lib/contenido'

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

    // Crear no lleva slug: el slug se genera del nombre, del lado del
    // servidor, para garantizar que sea unico contra todo el catalogo.
    if (body?.accion === 'crear') {
      const nombre = String(body?.nombre ?? '').trim().slice(0, 80)
      if (nombre.length < 2) {
        return NextResponse.json({ error: 'falta-nombre' }, { status: 400 })
      }
      const archivo = episodiosDelArchivo()
      const creado = await crearEpisodio(nombre, {
        slugs: archivo.map((e) => e.slug),
        ids: archivo.map((e) => Number(e.id) || 0),
        numeros: archivo.map((e) => Number(e.number) || 0),
      })
      if (!creado) return NextResponse.json({ error: 'no-se-pudo-crear' }, { status: 503 })
      return NextResponse.json({ ok: true, slug: creado.slug })
    }

    const slug = String(body?.slug ?? '')

    if (!(await buscarEpisodio(slug))) {
      return NextResponse.json({ error: 'episodio-desconocido' }, { status: 404 })
    }

    // Borrar solo alcanza a los creados en el panel. Los del archivo del
    // proyecto no se pueden borrar desde acá: para sacarlos de circulación
    // está el estado "muy pronto", que es reversible.
    if (body?.accion === 'borrar') {
      if (buscarEnArchivo(slug)) {
        return NextResponse.json({ error: 'episodio-del-archivo' }, { status: 409 })
      }
      await borrarEpisodio(slug)
      return NextResponse.json({ ok: true, accion: 'borrar' })
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
