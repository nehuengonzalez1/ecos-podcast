/**
 * Lectura de URLs de YouTube.
 *
 * Los episodios guardan la URL tal como se copia del navegador, que puede
 * venir de varias formas segun de donde se copio. En vez de exigir un formato
 * puntual al cargar el contenido, se aceptan todos y se extrae el id.
 *
 * Devolver null cuando no hay id es parte del diseño: hoy varios episodios
 * tienen la URL de ejemplo "https://youtube.com/", sin video. Quien muestra
 * el reproductor usa ese null para caer a la foto del episodio en vez de
 * incrustar un reproductor vacio.
 */

/** 11 caracteres del alfabeto que usa YouTube para sus ids. */
const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/

export function idDeYoutube(url?: string | null): string | null {
  if (!url) return null

  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    // youtu.be/ID
    if (host === 'youtu.be') {
      return validar(u.pathname.slice(1))
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      // youtube.com/watch?v=ID
      const v = u.searchParams.get('v')
      if (v) return validar(v)

      // youtube.com/embed/ID, /shorts/ID, /live/ID, /v/ID
      const partes = u.pathname.split('/').filter(Boolean)
      if (partes.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(partes[0])) {
        return validar(partes[1])
      }
    }

    return null
  } catch {
    // No es una URL. Puede ser que hayan pegado el id pelado.
    return validar(url.trim())
  }
}

function validar(posible: string): string | null {
  return ID_VALIDO.test(posible) ? posible : null
}

/**
 * URL para incrustar.
 *
 * Usa youtube-nocookie.com: sirve el mismo video pero no deja cookies de
 * seguimiento hasta que la persona le da play. No cuesta nada y es lo
 * correcto en una pagina donde la gente viene a leer historias intimas.
 */
export function urlDeEmbed(id: string): string {
  const params = new URLSearchParams({
    rel: '0', // al terminar no ofrece videos de otros canales
    modestbranding: '1',
    playsinline: '1',
  })
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

/** Miniatura oficial, para usar de portada antes de que carguen el video. */
export function miniaturaDeYoutube(id: string): string {
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
}
