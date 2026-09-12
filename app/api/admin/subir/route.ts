import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Subida de archivos para el panel de contenido.
 *
 * En Vercel no se puede escribir en public/: el sistema de archivos es de
 * solo lectura. Los archivos van a Vercel Blob, que devuelve una URL publica
 * y permanente, y esa URL es la que se guarda en la edicion del episodio.
 *
 * Si el store no esta creado no hay token, y entonces esto responde 501 con
 * un mensaje claro en vez de fallar de forma rara. El panel lo entiende y
 * ofrece pegar una URL a mano, asi se puede cargar contenido igual mientras
 * el store no exista.
 */

/** 12 MB. Las fotos del sitio pesan bastante menos; esto es un techo. */
const MAX_BYTES = 12 * 1024 * 1024

const TIPOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
])

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error: 'blob-sin-configurar',
        detalle:
          'Falta crear el store de Blob en Vercel. Mientras tanto podés pegar la URL de una imagen.',
      },
      { status: 501 },
    )
  }

  try {
    const form = await req.formData()
    const archivo = form.get('archivo')
    const carpeta = String(form.get('carpeta') ?? 'episodios').replace(/[^a-z0-9/-]/gi, '')

    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: 'falta-archivo' }, { status: 400 })
    }
    if (archivo.size > MAX_BYTES) {
      return NextResponse.json({ error: 'demasiado-grande' }, { status: 413 })
    }
    if (!TIPOS.has(archivo.type)) {
      return NextResponse.json(
        { error: 'tipo-no-permitido', detalle: archivo.type },
        { status: 415 },
      )
    }

    // `addRandomSuffix` evita que subir dos veces un archivo con el mismo
    // nombre pise al anterior: si un episodio ya publicó esa imagen, seguiría
    // sirviendo la nueva sin que nadie lo haya pedido.
    const subido = await put(`${carpeta}/${archivo.name}`, archivo, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({ ok: true, url: subido.url })
  } catch (e: any) {
    console.error('[subir] no se pudo subir el archivo:', e)
    return NextResponse.json({ error: 'error', detalle: e?.message }, { status: 500 })
  }
}
