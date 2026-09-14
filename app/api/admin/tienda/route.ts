import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { existeProducto, productosDelArchivo } from '@/lib/tienda'
import {
  CAMPOS_EDITABLES,
  TIENDA_EDITABLE,
  guardar,
  restaurar,
  crearProducto,
  borrarProducto,
  ocultarProducto,
  mostrarProducto,
  productosNuevos,
  type Override,
} from '@/lib/tienda-contenido'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Crear, editar y borrar productos.
 *
 * Solo se aceptan los campos de CAMPOS_EDITABLES: todo lo demás que venga en
 * el cuerpo se descarta en silencio. El `slug` queda fuera a propósito -- es
 * la dirección del producto, y cambiarlo rompe cualquier enlace guardado o
 * compartido.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  if (!TIENDA_EDITABLE) {
    return NextResponse.json(
      { error: 'sin-base', detalle: 'Las ediciones se guardan en Redis y no está conectado.' },
      { status: 503 },
    )
  }

  try {
    const body = await req.json().catch(() => ({}) as any)

    if (body?.accion === 'crear') {
      const nombre = String(body?.nombre ?? '').trim().slice(0, 80)
      if (nombre.length < 2) {
        return NextResponse.json({ error: 'falta-nombre' }, { status: 400 })
      }
      const creado = await crearProducto(
        nombre,
        productosDelArchivo().map((p) => p.slug),
      )
      if (!creado) return NextResponse.json({ error: 'no-se-pudo-crear' }, { status: 503 })
      return NextResponse.json({ ok: true, slug: creado.slug })
    }

    const slug = String(body?.slug ?? '')
    if (!(await existeProducto(slug))) {
      return NextResponse.json({ error: 'producto-desconocido' }, { status: 404 })
    }

    /**
     * Los del archivo se esconden y los del panel se borran de verdad.
     *
     * A diferencia de los sorteos, un producto no tiene gente colgando de él,
     * así que borrarlo no deja datos de nadie inalcanzables. Igual conviene
     * esconder antes que borrar: un producto agotado que quizá vuelva no
     * debería obligar a cargarlo de cero.
     */
    if (body?.accion === 'borrar') {
      const delArchivo = productosDelArchivo().some((p) => p.slug === slug)
      if (delArchivo) {
        await ocultarProducto(slug)
        return NextResponse.json({ ok: true, accion: 'ocultar' })
      }
      await borrarProducto(slug)
      return NextResponse.json({ ok: true, accion: 'borrar' })
    }

    if (body?.accion === 'mostrar') {
      await mostrarProducto(slug)
      return NextResponse.json({ ok: true, accion: 'mostrar' })
    }

    if (body?.accion === 'restaurar') {
      // Un producto creado en el panel no tiene original al que volver: su
      // contenido ES la edición, así que restaurarlo lo dejaría en blanco.
      const nuevos = await productosNuevos()
      if (nuevos.some((p) => p.slug === slug)) {
        return NextResponse.json({ error: 'sin-original' }, { status: 409 })
      }
      await restaurar(slug)
      return NextResponse.json({ ok: true, override: {} })
    }

    const cambios: Override = {}
    for (const campo of CAMPOS_EDITABLES) {
      if (campo in (body?.campos ?? {})) cambios[campo] = body.campos[campo]
    }

    // El precio se guarda como número entero de pesos. Si llega cualquier otra
    // cosa se descarta el campo en vez de escribir NaN, que en la ficha se
    // vería como "$ NaN".
    if ('precio' in cambios) {
      const n = Math.round(Number(cambios.precio))
      if (!Number.isFinite(n) || n < 0) delete cambios.precio
      else cambios.precio = n
    }

    const override = await guardar(slug, cambios)
    return NextResponse.json({ ok: true, override })
  } catch (e: any) {
    console.error('[tienda] no se pudo guardar la edición:', e)
    return NextResponse.json({ error: 'error', detalle: e?.message }, { status: 500 })
  }
}
