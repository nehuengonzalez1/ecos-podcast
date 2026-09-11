'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { idDeYoutube, urlDeEmbed, miniaturaDeYoutube } from '@/lib/youtube'

/**
 * El video del episodio, servido por YouTube.
 *
 * Hasta que alguien le da play no se carga nada de YouTube: se muestra una
 * portada propia y recien al hacer click aparece el reproductor. Incrustar el
 * iframe de entrada traeria varios cientos de kB de javascript ajeno y
 * cookies de seguimiento a todo el que abra la pagina, aunque no mire el
 * video. Asi la pagina carga liviana y nadie es rastreado sin haber elegido
 * mirar.
 *
 * Si el episodio no tiene una URL con id de video -- hoy varios tienen la de
 * ejemplo -- no se incrusta nada: queda la foto con un boton que abre
 * YouTube en una pestaña nueva.
 */
export function ReproductorEpisodio({
  youtube,
  photo,
  guest,
  quote,
}: {
  youtube?: string | null
  photo?: string | null
  guest: string
  quote?: string | null
}) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const id = idDeYoutube(youtube)

  const portada = photo || (id ? miniaturaDeYoutube(id) : '')

  if (reproduciendo && id) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={`${urlDeEmbed(id)}&autoplay=1`}
          title={`Episodio con ${guest}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    )
  }

  const contenido = (
    <>
      {portada && (
        <img
          src={portada}
          alt={`Episodio con ${guest}`}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-ink-900/40" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-cream-50/70 bg-ink-900/35 text-cream-50 backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-ink-900/55">
          <Play size={24} fill="currentColor" className="ml-1" />
        </span>
      </div>

      {quote && (
        <p className="pointer-events-none absolute bottom-6 right-6 max-w-[55%] text-right font-hand text-xl leading-tight text-cream-50/85 drop-shadow-lg sm:text-2xl">
          {quote}
        </p>
      )}
    </>
  )

  // Sin id no hay nada que incrustar: el mismo bloque se vuelve un enlace a
  // YouTube, asi la portada nunca queda siendo un boton que no hace nada.
  if (!id) {
    return (
      <a
        href={youtube || '#'}
        target="_blank"
        rel="noreferrer"
        aria-label={`Ver en YouTube el episodio con ${guest}`}
        className="group relative block aspect-video w-full overflow-hidden bg-ink-700"
      >
        {contenido}
      </a>
    )
  }

  return (
    <button
      onClick={() => setReproduciendo(true)}
      aria-label={`Reproducir el episodio con ${guest}`}
      className="group relative block aspect-video w-full overflow-hidden bg-ink-700"
    >
      {contenido}
    </button>
  )
}
