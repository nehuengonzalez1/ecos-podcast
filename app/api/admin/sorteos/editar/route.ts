import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { existeSorteo, sorteosDelArchivo } from '@/lib/sorteos'
import { contarParticipantes } from '@/lib/participaciones'
import {
  CAMPOS_EDITABLES,
  SORTEOS_EDITABLES,
  guardar,
  restaurar,
  crearSorteo,
  borrarSorteo,
  ocultarSorteo,
  mostrarSorteo,
  sorteosNuevos,
  type Override,
} from '@/lib/sorteos-contenido'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Crear, editar y borrar sorteos.
 *
 * Solo se aceptan los campos de CAMPOS_EDITABLES: todo lo demás que venga en
 * el cuerpo se descarta en silencio. El `slug` queda fuera del alcance a
 * propósito -- es la clave bajo la que se guardan las participaciones, así
 * que cambiarlo dejaría a los anotados colgando de un sorteo inexistente.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  if (!SORTEOS_EDITABLES) {
    return NextResponse.json(
      { error: 'sin-base', detalle: 'Las ediciones se guardan en Redis y no está conectado.' },
      { status: 503 },
    )
  }

  try {
    const body = await req.json().catch(() => ({}) as any)

    // Crear no lleva slug: se genera del título, del lado del servidor, para
    // garantizar que sea único contra todo el catálogo.
    if (body?.accion === 'crear') {
      const titulo = String(body?.titulo ?? '').trim().slice(0, 80)
      if (titulo.length < 2) {
        return NextResponse.json({ error: 'falta-titulo' }, { status: 400 })
      }
      const creado = await crearSorteo(
        titulo,
        sorteosDelArchivo().map((s) => s.slug),
      )
      if (!creado) return NextResponse.json({ error: 'no-se-pudo-crear' }, { status: 503 })
      return NextResponse.json({ ok: true, slug: creado.slug })
    }

    const slug = String(body?.slug ?? '')
    if (!(await existeSorteo(slug))) {
      return NextResponse.json({ error: 'sorteo-desconocido' }, { status: 404 })
    }

    /**
     * Borrar saca el sorteo del sitio, pero casi nunca lo borra de verdad.
     *
     * Solo se borra del todo un sorteo creado en el panel al que no se anotó
     * nadie: el caso de haberlo creado por error. Con gente anotada se
     * esconde, igual que los del archivo.
     *
     * El motivo es que las participaciones se guardan bajo el slug. Borrar el
     * sorteo no las borra -- siguen en la base -- pero las deja inalcanzables:
     * el panel responde "sorteo desconocido" y no hay forma de llegar a esa
     * lista nunca más. Es decir, los datos de gente real quedan en la nada por
     * un clic. Escondido, en cambio, desaparece del sitio igual y en el panel
     * sigue a la vista con sus anotados intactos.
     *
     * Los del archivo del proyecto tampoco se borran, pero por otro motivo:
     * viven dentro del build y no se pueden tocar desde acá.
     */
    if (body?.accion === 'borrar') {
      const delArchivo = sorteosDelArchivo().some((s) => s.slug === slug)
      const anotados = await contarParticipantes(slug)

      if (delArchivo || anotados > 0) {
        await ocultarSorteo(slug)
        return NextResponse.json({ ok: true, accion: 'ocultar', anotados })
      }

      await borrarSorteo(slug)
      return NextResponse.json({ ok: true, accion: 'borrar' })
    }

    if (body?.accion === 'mostrar') {
      await mostrarSorteo(slug)
      return NextResponse.json({ ok: true, accion: 'mostrar' })
    }

    if (body?.accion === 'restaurar') {
      // Un sorteo creado en el panel no tiene original al que volver: su
      // contenido ES la edición, así que restaurarlo lo dejaría en blanco.
      const nuevos = await sorteosNuevos()
      if (nuevos.some((s) => s.slug === slug)) {
        return NextResponse.json({ error: 'sin-original' }, { status: 409 })
      }
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
    console.error('[sorteos] no se pudo guardar la edición:', e)
    return NextResponse.json({ error: 'error', detalle: e?.message }, { status: 500 })
  }
}
