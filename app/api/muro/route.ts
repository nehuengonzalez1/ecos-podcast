import { NextResponse, after } from 'next/server'
import { esEpisodioPublicado, buscarEpisodio, refDeEpisodio } from '@/lib/episodios'
import { enviarAvisoMuro } from '@/lib/mailer'
import { nombreDeUsuarioActual } from '@/lib/usuario'
import {
  crearMensaje,
  dentroDelLimite,
  limpiar,
  mensajesAprobados,
  ETIQUETAS,
  LIMITES,
  MINIMO_MENSAJE,
  FIRMA_ANONIMA,
  TIPOS,
  MURO_ACTIVO,
  type TipoMensaje,
} from '@/lib/muro'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Detrás de Vercel el cliente real es el primero de la cadena. */
function ipDe(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? ''
}

/**
 * Comprobación de forma, no de existencia. Alcanza para frenar un tipeo; no
 * pretende verificar que la casilla exista, cosa que solo probaría un envío.
 */
function emailValido(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}


/** Los mensajes publicados de un episodio. Público: los lee cualquiera. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') ?? ''
  if (!(await esEpisodioPublicado(slug))) {
    return NextResponse.json({ error: 'episodio-desconocido' }, { status: 404 })
  }
  const mensajes = await mensajesAprobados(slug)
  return NextResponse.json({ ok: true, activo: MURO_ACTIVO, mensajes })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}) as any)

    // Campo trampa: invisible en el formulario, así que solo lo completa un
    // bot. Respondemos ok para no enseñarle que fue detectado.
    if (limpiar(body?.web, 50)) {
      return NextResponse.json({ ok: true, estado: 'pendiente' })
    }

    const slug = limpiar(body?.slug, 120)
    const ep = await buscarEpisodio(slug)
    if (!ep || ep.status !== 'available') {
      return NextResponse.json({ error: 'episodio-desconocido' }, { status: 404 })
    }

    const mensaje = limpiar(body?.mensaje, LIMITES.mensaje)
    const tipoCrudo = limpiar(body?.tipo, 20) as TipoMensaje
    const tipo: TipoMensaje = TIPOS.includes(tipoCrudo) ? tipoCrudo : 'mensaje'
    const anonimo = body?.anonimo === true

    if (mensaje.length < MINIMO_MENSAJE) {
      return NextResponse.json({ error: 'faltan-datos' }, { status: 400 })
    }

    // Con sesion iniciada el nombre sale de la cuenta, no del cuerpo del
    // pedido. Si se tomara del pedido, cualquiera podria firmar con el nombre
    // de una cuenta ajena mandando el JSON a mano.
    const nombreSesion = await nombreDeUsuarioActual()

    let nombre: string
    let email = ''

    if (nombreSesion) {
      nombre = nombreSesion
    } else {
      // Sin sesion, el nombre y el email son la unica forma de saber quien
      // escribio. El email no se publica: queda para poder identificar a la
      // persona si un mensaje trae problemas.
      nombre = limpiar(body?.nombre, LIMITES.nombre)
      email = limpiar(body?.email, LIMITES.email).toLowerCase()

      if (nombre.length < 2) {
        return NextResponse.json({ error: 'falta-nombre' }, { status: 400 })
      }
      if (!emailValido(email)) {
        return NextResponse.json({ error: 'email-invalido' }, { status: 400 })
      }
    }

    if (!MURO_ACTIVO) {
      // Sin base no hay dónde guardarlo. Mejor decirlo que fingir que entró.
      return NextResponse.json({ error: 'muro-inactivo' }, { status: 503 })
    }

    if (!(await dentroDelLimite(ipDe(req)))) {
      return NextResponse.json({ error: 'demasiados-mensajes' }, { status: 429 })
    }

    const guardado = await crearMensaje({
      slug,
      nombre,
      mensaje,
      tipo,
      ...(email ? { email } : {}),
      ...(anonimo ? { anonimo: true } : {}),
    })
    if (!guardado) {
      return NextResponse.json({ error: 'no-se-pudo-guardar' }, { status: 503 })
    }

    // El aviso no debe hacer esperar a quien escribio ni hacer fallar el
    // envio: si Resend tarda o esta caido, el mensaje ya quedo guardado y se
    // modera igual desde el panel.
    //
    // Pero soltar la promesa sin mas no alcanza: apenas se responde, la
    // funcion se congela y el fetch a Resend se corta a mitad de vuelo. Por
    // eso los avisos del muro no llegaban nunca, mientras que los de
    // /api/contact -- que si esperan -- salian bien. `after` corre la tarea
    // despues de la respuesta y mantiene viva la funcion hasta que termina.
    after(async () => {
      await enviarAvisoMuro(
        {
          nombre: anonimo ? `${nombre} (pidio anonimato)` : nombre,
          mensaje,
          etiqueta: ETIQUETAS[tipo],
          ...(guardado.motivo ? { motivo: guardado.motivo } : {}),
        },
        refDeEpisodio(ep),
      )
    })

    return NextResponse.json({
      ok: true,
      estado: guardado.estado,
      // Si salió publicado, el muro lo muestra al instante, sin recargar. Si
      // quedó retenido no se devuelve nada: aparecer en pantalla y no estar
      // en el muro para nadie más sería peor que decir que está en camino.
      mensaje:
        guardado.estado === 'aprobado'
          ? {
              id: guardado.id,
              slug: guardado.slug,
              nombre: anonimo ? FIRMA_ANONIMA : guardado.nombre,
              mensaje: guardado.mensaje,
              tipo: guardado.tipo,
              at: guardado.at,
              apoyos: 0,
            }
          : null,
    })
  } catch (e: any) {
    console.error('[muro] error al recibir un mensaje:', e)
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
