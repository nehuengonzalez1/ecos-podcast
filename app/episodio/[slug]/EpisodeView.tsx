'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, Mail, MessageSquare, Play, Share2,
} from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { PremiumGate } from '@/components/PremiumGate'
import { TrackedLink } from '@/components/TrackedLink'
import { idDeYoutube, miniaturaDeYoutube } from '@/lib/youtube'
import { nombreParaHablarle } from '@/lib/utils'
import { IconoSpotify } from '@/components/IconoSpotify'
import { ReproductorEpisodio } from '@/components/ReproductorEpisodio'
import { ModalCarta } from '@/components/ModalCarta'
import { ModalRegalo } from '@/components/ModalRegalo'
import { MuroProvider, DejaTuMensaje, LoQueQuedo } from '@/components/Muro'

const GUARDADOS = 'episodios:guardados'

/**
 * Foto de la carta por defecto.
 *
 * La imagen es de marca -- el sobre de LQLVE --, no de un episodio puntual,
 * asi que sirve para todos. Un episodio puede pisarla con la suya cargando
 * `carta.imagen`. Si el archivo todavia no esta subido no se rompe nada: el
 * marco cae al dibujo de respaldo.
 */
const CARTA_POR_DEFECTO = '/imagenes/carta.jpg'

/**
 * Los regalos disponibles hoy. Están recortados contra transparencia, que es
 * lo que les permite flotar en el visor sin quedar como un rectángulo pegado
 * sobre la página.
 */
const REGALOS = [
  '/imagenes/regalos/emprendedor.webp',
  '/imagenes/regalos/cromanon.webp',
  '/imagenes/regalos/malvinas.webp',
  '/imagenes/regalos/autismo.webp',
] as const

/**
 * Qué regalo le toca a un episodio que todavía no tiene el suyo cargado.
 *
 * Es provisorio y se nota que lo es: hay cuatro fotos para trece episodios,
 * así que se reparten rotando por id. No se intenta adivinar cuál le
 * corresponde a cada historia -- pegarle el regalo de Malvinas a un episodio
 * que no habla de Malvinas sería peor que repetir.
 *
 * La rotación vive acá y no escrita en episodes.json a propósito: ese archivo
 * es contenido real, y llenarlo de asignaciones inventadas obligaría después
 * a distinguir cuáles puso una persona y cuáles puse yo. Cuando cargues el
 * regalo de verdad en `regalo.imagen`, pisa esto sin que haya nada que
 * limpiar.
 */
function regaloDe(ep: any): string {
  if (ep.regalo?.imagen) return ep.regalo.imagen
  const n = Number(ep.id ?? ep.number) || 0
  return REGALOS[n % REGALOS.length]
}

/**
 * Texto de la carta cuando el episodio todavía no tiene el suyo.
 *
 * Está escrito para servirle a cualquier invitado, así que los trece
 * episodios tienen una carta de verdad desde hoy en vez de un bloque vacío.
 * `carta.texto` lo reemplaza cuando se cargue el de cada uno.
 */
const CARTA_POR_DEFECTO_TEXTO = `Gracias por abrirte, por confiar y por compartir una parte de tu historia.

Lo que contaste no termina acá. Queda en quienes te escuchamos, en las preguntas que nos hiciste pensar y en las conversaciones que todavía siguen.

A veces, una sola historia puede cambiar la forma en la que vemos las cosas. Esta ya es parte del archivo.

Gracias por ser parte.`

/**
 * Los dos botones principales comparten forma y tamaño; solo cambia el
 * relleno. Salen de la misma constante a proposito: cuando cada uno tenia
 * sus clases sueltas, el borde de uno le sumaba dos pixeles de alto y
 * quedaban desparejos sin que se notara de donde venia.
 */
const BOTON =
  'inline-flex h-10 items-center gap-2 rounded-sm border px-4 text-[11px] font-semibold uppercase tracking-[0.1em] transition'
const BOTON_LLENO = 'border-cream-50 bg-cream-50 text-ink-900 hover:border-white hover:bg-white'
const BOTON_BORDE = 'border-cream-400/25 text-cream-100 hover:border-gold hover:text-gold'

/** Primera oración de un texto, para usar de bajada sin repetir el resumen. */
function primeraFrase(texto?: string | null): string {
  if (!texto) return ''
  const corte = texto.search(/[.?!](\s|$)/)
  return corte === -1 ? texto : texto.slice(0, corte + 1)
}

export function EpisodeView({
  ep,
  available,
  upcoming,
  nombreUsuario,
}: {
  ep: any
  available: any[]
  upcoming: any[]
  /** Nombre de quien tiene sesión iniciada, o null si no hay. */
  nombreUsuario: string | null
}) {
  // El siguiente puede estar todavía sin publicar: en ese caso se muestra
  // igual, en modo "muy pronto", que es parte de lo que sostiene el interés.
  const numero = Number(ep.number)
  const siguiente = [...available, ...upcoming].find((e) => Number(e.number) === numero + 1) ?? null

  // Se prefieren los de la misma categoría; si no alcanzan, se completa con
  // el resto, para que el bloque nunca quede a medias.
  const relacionados = [
    ...available.filter((e) => e.slug !== ep.slug && e.category === ep.category),
    ...available.filter((e) => e.slug !== ep.slug && e.category !== ep.category),
  ].slice(0, 2)

  const [cartaAbierta, setCartaAbierta] = useState(false)
  const [regaloAbierto, setRegaloAbierto] = useState(false)

  return (
    <MuroProvider slug={ep.slug} guest={ep.guest} nombreUsuario={nombreUsuario}>
      <section className="spotlight-bg pt-20 pb-12">
        <div className="container-page">
          <Link
            href="/archivo"
            className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-cream-200/60 hover:text-gold"
          >
            <ArrowLeft size={12} /> Volver al archivo
          </Link>

          {/* Video · ficha del episodio · lo que viene */}
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] xl:grid-cols-[1.15fr_1.1fr_210px]">
            <ReproductorEpisodio
              youtube={ep.youtube}
              photo={ep.photo}
              guest={ep.guest}
              quote={ep.shortQuote ?? ep.quote}
            />

            <Ficha ep={ep} />

            <aside className="xl:border-l xl:border-cream-400/10 xl:pl-5">
              {siguiente && <Siguiente ep={siguiente} />}
              {relacionados.length > 0 && (
                <div className={siguiente ? 'mt-8' : ''}>
                  <p className="eyebrow mb-3">Episodios relacionados</p>
                  <ul className="space-y-3">
                    {relacionados.map((e) => (
                      <li key={e.id}>
                        <Relacionado ep={e} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>

          {/* Lo que pasó · frases · dejá tu mensaje */}
          <div className="mt-8 grid gap-6 border-t border-cream-400/10 pt-6 md:grid-cols-2 xl:grid-cols-[1fr_1.3fr_250px]">
            <div>
              <p className="eyebrow mb-3">Lo que pasó</p>
              <p className="body-copy text-sm leading-relaxed text-cream-100/85">{ep.summary}</p>
            </div>

            <div className="md:border-l md:border-cream-400/10 md:pl-6">
              <p className="eyebrow mb-3">Frases que nos quedaron</p>
              {/* Columnas de texto, no grilla. En una grilla las filas se
                  alinean entre columnas: una frase de un renglon al lado de
                  una de dos queda con un hueco debajo, y el bloque se lee
                  como piezas sueltas en vez de una lista pareja. Fluyendo por
                  columnas cada frase ocupa solo su alto y el ritmo entre
                  todas es el mismo. */}
              <div className="columns-1 gap-x-6 sm:columns-2">
                {(ep.moments ?? []).slice(0, 6).map((m: string, i: number) => (
                  <p
                    key={i}
                    className="mb-2.5 break-inside-avoid font-serif text-[13px] italic leading-snug text-cream-100/85"
                  >
                    &ldquo;{m}&rdquo;
                  </p>
                ))}
              </div>
            </div>

            <div className="xl:border-l xl:border-cream-400/10 xl:pl-6">
              <DejaTuMensaje />
            </div>
          </div>

          {/* Detrás de escena · la carta · el regalo */}
          <div className="mt-8 grid gap-6 border-t border-cream-400/10 pt-6 lg:grid-cols-2 xl:grid-cols-[1.55fr_0.62fr_1fr]">
            <PremiumGate label="Detrás de escena (Archivo Completo)">
              <DetrasDeEscena ep={ep} />
            </PremiumGate>

            {/* La carta queda fuera del muro de pago a propósito: es gratis. */}
            <div
              id="carta"
              className="flex h-full scroll-mt-24 flex-col xl:border-l xl:border-cream-400/10 xl:pl-6"
            >
              <p className="eyebrow mb-3">La carta</p>
              <Foto
                src={ep.carta?.imagen ?? CARTA_POR_DEFECTO}
                alt={`La carta de ${ep.guest}`}
                proporcion="aspect-[16/11]"
              >
                <PapelCarta />
              </Foto>
              <p className="mt-3 text-xs text-cream-200/70">
                La carta completa de {nombreParaHablarle(ep.guest)}.
              </p>
              <button
                onClick={() => {
                  // Se sigue registrando el uso, igual que cuando esto era un
                  // enlace: es la señal que distingue mirar de leer.
                  fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accion: 'carta', slug: ep.slug }),
                    keepalive: true,
                  }).catch(() => {})
                  setCartaAbierta(true)
                }}
                className="btn-ghost mt-auto w-full justify-center"
              >
                Leer carta <ArrowRight size={12} />
              </button>
            </div>

            <div className="flex h-full flex-col xl:border-l xl:border-cream-400/10 xl:pl-6">
              <RegaloDelEpisodio ep={ep} onAbrir={() => setRegaloAbierto(true)} />
            </div>
          </div>

          <LoQueQuedo />
        </div>
      </section>

      <ModalCarta
        abierto={cartaAbierta}
        onCerrar={() => setCartaAbierta(false)}
        guest={ep.guest}
        texto={ep.carta?.texto ?? CARTA_POR_DEFECTO_TEXTO}
      />

      <ModalRegalo
        abierto={regaloAbierto}
        onCerrar={() => setRegaloAbierto(false)}
        imagen={regaloDe(ep)}
        guest={ep.guest}
        nota={ep.regalo?.nota}
      />
    </MuroProvider>
  )
}

/**
 * Los cortes del episodio. Es contenido de suscriptores, así que esta parte
 * se renderiza dentro del candado.
 *
 * Los cortes salen de `ep.detrasDeEscena`, un campo que todavía no tiene
 * ningún episodio: se carga por episodio desde el panel de contenido. Cuando
 * está vacío se dibujan marcos vacíos en vez de cortes inventados —- detrás
 * del candado hacen de fondo, y a un suscriptor le dicen la verdad: que
 * todavía no hay nada cargado.
 */
function DetrasDeEscena({ ep }: { ep: any }) {
  const cortes: any[] = Array.isArray(ep.detrasDeEscena) ? ep.detrasDeEscena : []

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">Detrás de escena</p>
        {cortes.length > 4 && (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-cream-200/60">
            Ver todos <ArrowRight size={11} />
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-cream-200/70">Todo lo que no viste en el episodio.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cortes.length > 0
          ? cortes.slice(0, 4).map((c, i) => <Corte key={i} corte={c} guest={ep.guest} />)
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video bg-ink-700/70" aria-hidden="true" />
            ))}
      </div>

      {cortes.length === 0 && (
        <p className="mt-3 text-[11px] text-cream-400/60">
          Todavía no cargamos los cortes de este episodio.
        </p>
      )}
    </div>
  )
}

function Corte({ corte, guest }: { corte: any; guest: string }) {
  const id = idDeYoutube(corte?.youtube)
  const portada = corte?.thumb || (id ? miniaturaDeYoutube(id) : '')

  return (
    <a
      href={corte?.youtube || '#'}
      target="_blank"
      rel="noreferrer"
      className="group block"
      aria-label={`${corte?.titulo ?? 'Corte'} · episodio con ${guest}`}
    >
      <div className="relative aspect-video overflow-hidden bg-ink-700">
        {portada && (
          <img
            src={portada}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-50/70 bg-ink-900/35 text-cream-50 backdrop-blur-sm transition group-hover:bg-ink-900/60">
            <Play size={12} fill="currentColor" className="ml-0.5" />
          </span>
        </span>
        {corte?.duracion && (
          <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-ink-900/80 px-1.5 py-0.5 text-[10px] text-cream-100">
            {corte.duracion}
          </span>
        )}
      </div>
      {corte?.titulo && (
        <p className="mt-2 truncate text-xs text-cream-100/85">{corte.titulo}</p>
      )}
    </a>
  )
}

/**
 * El objeto que el equipo le regaló a la persona del episodio.
 *
 * Reemplaza a "Objetos de su historia". Sale de `ep.regalo`, que todavía no
 * tiene ningún episodio: se carga desde el panel de contenido. Sin datos, el
 * bloque dice que viene en camino en vez de quedar vacío y descolgar la fila.
 */
function RegaloDelEpisodio({ ep, onAbrir }: { ep: any; onAbrir: () => void }) {
  const nombrePila = nombreParaHablarle(ep.guest)
  const nota =
    ep.regalo?.nota ??
    `En cada episodio le dejamos algo a quien vino a contar su historia. El de ${nombrePila} lo publicamos muy pronto.`

  return (
    <>
      <p className="eyebrow mb-3">El regalo del episodio</p>

      {/* Imagen a la izquierda y texto al costado, como en el diseño. La
          estructura es la misma haya o no datos cargados: si cambiara segun
          el caso, la fila se vería distinta en cada episodio hasta terminar
          de cargar el contenido. */}
      <div className="flex gap-4">
        <div className="w-[44%] shrink-0">
          {/* Cuadrado y no vertical: las fotos son apaisadas y en un hueco 4:5
                  se les comia los costados. */}
              <Foto
                src={regaloDe(ep)}
                alt={`El regalo de ${ep.guest}`}
                proporcion="aspect-square"
              >
            <CajaRegalo />
          </Foto>
        </div>
        <p className="text-xs leading-relaxed text-cream-200/80">{nota}</p>
      </div>

      <button
        onClick={() => {
          // Se sigue registrando el uso, igual que cuando esto era un enlace:
          // es la señal que distingue mirar la miniatura de abrir el regalo.
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'regalos', slug: ep.slug }),
            keepalive: true,
          }).catch(() => {})
          onAbrir()
        }}
        className="btn-ghost mt-auto w-full justify-center"
      >
        Ver el regalo <ArrowRight size={12} />
      </button>
    </>
  )
}

/**
 * Marco de imagen con respaldo dibujado.
 *
 * El diseño muestra fotos reales de la carta y del regalo. Todavía no hay
 * ninguna cargada, así que mientras tanto se dibuja algo con la misma forma
 * y el mismo peso visual: la fila se ve como va a verse, y el día que se
 * carguen las fotos entran en el mismo hueco sin mover nada.
 */
function Foto({
  src,
  alt,
  proporcion,
  children,
}: {
  src?: string | null
  alt: string
  proporcion: string
  children: React.ReactNode
}) {
  // Si el archivo todavía no está subido, el navegador mostraría el ícono de
  // imagen rota. Cayendo al dibujo, la página se ve entera igual y el día que
  // el archivo aparece se usa solo, sin tocar nada.
  const [fallo, setFallo] = useState(false)
  useEffect(() => setFallo(false), [src])

  const mostrarImagen = !!src && !fallo

  return (
    <div className={`${proporcion} relative w-full overflow-hidden bg-ink-700`}>
      {mostrarImagen ? (
        <img
          src={src!}
          alt={alt}
          onError={() => setFallo(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        children
      )}
    </div>
  )
}

/** Respaldo de la carta: una tarjeta clara apoyada sobre un fondo oscuro. */
function PapelCarta() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-600 to-ink-900"
    >
      <span className="w-[62%] rotate-[-3deg] bg-cream-100 px-3 py-5 text-center shadow-polaroid">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-ink-900/70">
          {brand.name}
        </span>
      </span>
    </span>
  )
}

/** Respaldo del regalo: una caja de papel madera con una tarjeta adentro. */
function CajaRegalo() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-600 to-ink-900 p-3"
    >
      <span className="kraft flex h-full w-full items-center justify-center rounded-sm p-2">
        <span className="w-full rotate-[-2deg] bg-cream-100/95 py-3 text-center shadow-md">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.25em] text-ink-900/70">
            {brand.name}
          </span>
        </span>
      </span>
    </span>
  )
}

function Ficha({ ep }: { ep: any }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-cream-200/60">Ep. {ep.number}</p>

      <h1 className="mt-1.5 font-serif text-4xl leading-[0.95] text-cream-50 md:text-5xl">
        {ep.guest}
      </h1>

      <blockquote className="mt-4">
        <p className="font-serif text-lg italic leading-snug text-cream-100/90 md:text-xl">
          &ldquo;{ep.quote}&rdquo;
        </p>
      </blockquote>

      {/* Una línea corta, no el relato completo: ese vive abajo, en "Lo que
          pasó". Si se repitiera el mismo texto en los dos lugares, la página
          se leería como si tartamudeara. `intro` es opcional y se va a poder
          cargar por episodio; hasta entonces se usa la primera frase. */}
      <p className="body-copy mt-4 text-[13px] leading-relaxed text-cream-200/70">
        {ep.intro ?? primeraFrase(ep.summary)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <a href={ep.youtube ?? '#'} target="_blank" rel="noreferrer" className={`${BOTON} ${BOTON_LLENO}`}>
          <Play size={14} fill="currentColor" /> Ver episodio
        </a>
        <a href={ep.spotify ?? '#'} target="_blank" rel="noreferrer" className={`${BOTON} ${BOTON_BORDE}`}>
          <IconoSpotify className="h-[15px] w-[15px]" /> Escuchar en Spotify
        </a>
      </div>

      <Acciones ep={ep} />
    </div>
  )
}

/**
 * La fila de acciones bajo los botones principales.
 *
 * Del diseño falta "Descargar": no hay archivo del episodio para bajar, el
 * video lo sirve YouTube. Antes que un botón que no hace nada, no se muestra.
 */
function Acciones({ ep }: { ep: any }) {
  const [guardado, setGuardado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    try {
      const xs = JSON.parse(localStorage.getItem(GUARDADOS) ?? '[]')
      setGuardado(Array.isArray(xs) && xs.includes(ep.slug))
    } catch {
      /* sin storage no se puede recordar; el botón igual funciona en la sesión */
    }
  }, [ep.slug])

  const alternarGuardado = () => {
    setGuardado((antes) => {
      const ahora = !antes
      try {
        const xs: string[] = JSON.parse(localStorage.getItem(GUARDADOS) ?? '[]')
        const lista = ahora ? [...new Set([...xs, ep.slug])] : xs.filter((s) => s !== ep.slug)
        localStorage.setItem(GUARDADOS, JSON.stringify(lista))
      } catch {
        /* idem */
      }
      return ahora
    })
  }

  const compartir = async () => {
    const url = window.location.href
    const texto = `"${ep.quote}" — ${ep.guest} · ${brand.name}`
    // El menú nativo es lo que la gente espera en el teléfono; en escritorio
    // casi nunca existe, y ahí copiar el link es más útil que abrir una red
    // puntual elegida por nosotros.
    if (navigator.share) {
      try {
        await navigator.share({ title: `${ep.guest} · ${brand.name}`, text: texto, url })
        return
      } catch {
        /* si lo cancelan, cae a copiar */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sin permiso de portapapeles no hay mucho más que hacer */
    }
  }

  const base =
    'inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.06em] text-cream-200/60 transition hover:text-gold'

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button onClick={alternarGuardado} className={base} aria-pressed={guardado}>
        {guardado ? <BookmarkCheck size={12} className="text-gold" /> : <Bookmark size={12} />}
        {guardado ? 'Guardado' : 'Guardar'}
      </button>

      <button onClick={compartir} className={base}>
        {copiado ? <Check size={12} className="text-gold" /> : <Share2 size={12} />}
        {copiado ? 'Link copiado' : 'Compartir'}
      </button>

      <a href="#muro" className={base}>
        <MessageSquare size={12} /> Mensajes
      </a>

      <a href="#carta" className={base}>
        <Mail size={12} /> Carta del invitado
      </a>
    </div>
  )
}

function Siguiente({ ep }: { ep: any }) {
  const disponible = ep.status === 'available'

  return (
    <div>
      <p className="eyebrow mb-3">Siguiente episodio</p>
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden bg-ink-700">
          {ep.photo && (
            <img
              src={ep.photo}
              alt=""
              className={`h-full w-full object-cover ${disponible ? '' : 'opacity-30 grayscale'}`}
              loading="lazy"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-cream-200/60">Ep. {ep.number}</p>
          <p className="mt-0.5 truncate text-xs text-cream-50">
            {disponible ? ep.guest : 'Muy pronto.'}
          </p>
        </div>
      </div>

      {disponible ? (
        <Link href={`/episodio/${ep.slug}`} className="btn-ghost mt-4 w-full justify-center">
          Ver episodio <ArrowRight size={12} />
        </Link>
      ) : (
        <p className="mt-4 border border-cream-400/15 px-3 py-2.5 text-center text-[10px] uppercase tracking-widest text-cream-200/50">
          Muy pronto
        </p>
      )}
    </div>
  )
}

function Relacionado({ ep }: { ep: any }) {
  return (
    <Link
      href={`/episodio/${ep.slug}`}
      className="group flex items-center gap-3 transition hover:opacity-90"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden bg-ink-700">
        {ep.photo && (
          <img src={ep.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-cream-200/60">Ep. {ep.number}</p>
        <p className="truncate text-xs text-cream-50">{ep.guest}</p>
      </div>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cream-400/30 text-cream-100 transition group-hover:border-gold group-hover:text-gold">
        <Play size={11} fill="currentColor" />
      </span>
    </Link>
  )
}
