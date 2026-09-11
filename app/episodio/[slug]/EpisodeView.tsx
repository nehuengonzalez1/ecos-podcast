'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, Mail, MessageSquare, Play, Share2,
} from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { Envelope } from '@/components/Envelope'
import { PremiumGate } from '@/components/PremiumGate'
import { TrackedLink } from '@/components/TrackedLink'
import { ReproductorEpisodio } from '@/components/ReproductorEpisodio'
import { MuroProvider, DejaTuMensaje, LoQueQuedo } from '@/components/Muro'

const GUARDADOS = 'episodios:guardados'

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
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {(ep.moments ?? []).slice(0, 6).map((m: string, i: number) => (
                  <p key={i} className="font-serif text-sm italic leading-relaxed text-cream-100/85">
                    &ldquo;{m}&rdquo;
                  </p>
                ))}
              </div>
            </div>

            <div className="xl:border-l xl:border-cream-400/10 xl:pl-6">
              <DejaTuMensaje />
            </div>
          </div>

          {/* La carta · regalos · objetos */}
          <div
            id="carta"
            className="mt-8 grid scroll-mt-24 gap-6 border-t border-cream-400/10 pt-6 md:grid-cols-3"
          >
            <PremiumGate label="La carta (Archivo Completo)">
              <div className="flex h-full flex-col">
                <p className="eyebrow mb-3">La carta</p>
                {/* Acotado para que el sobre no estire la fila entera: las
                    tres columnas tienen que leerse como pares. */}
                <Envelope label="La carta" sealText={brand.name[0]} className="max-w-[190px]" />
                <p className="mt-4 text-xs text-cream-200/70">
                  La carta completa de {ep.guest.split(' ')[0]}.
                </p>
                <TrackedLink
                  accion="carta"
                  slug={ep.slug}
                  href={`/premium/${ep.slug}/carta.pdf`}
                  className="btn-ghost mt-auto w-full justify-center"
                >
                  Leer carta <ArrowRight size={12} />
                </TrackedLink>
              </div>
            </PremiumGate>

            <PremiumGate
              label="Regalos ocultos (Archivo Completo)"
              className="md:border-l md:border-cream-400/10 md:pl-6"
            >
              <div className="flex h-full flex-col">
                <p className="eyebrow mb-3">Regalos ocultos</p>
                <p className="text-xs leading-relaxed text-cream-200/70">
                  Desbloqueá el archivo completo y accedé a los regalos ocultos, audios inéditos y
                  más contenido de este episodio.
                </p>
                <TrackedLink
                  accion="regalos"
                  slug={ep.slug}
                  href={`/premium/${ep.slug}/regalos.zip`}
                  className="btn-ghost mt-auto w-full justify-center"
                >
                  Desbloquear
                </TrackedLink>
              </div>
            </PremiumGate>

            {ep.extras?.object && (
              <div className="flex h-full flex-col md:border-l md:border-cream-400/10 md:pl-6">
                <p className="eyebrow mb-3">Objetos de su historia</p>
                <div className="flex aspect-[4/3] max-w-[190px] items-center justify-center border border-cream-400/15 bg-ink-700 px-3 text-center text-xs uppercase tracking-widest text-cream-300/50">
                  {ep.extras.object.name}
                </div>
                <p className="mt-4 font-serif text-sm italic leading-relaxed text-cream-200/80">
                  &ldquo;{ep.extras.object.note}&rdquo;
                </p>
              </div>
            )}
          </div>

          <LoQueQuedo />
        </div>
      </section>
    </MuroProvider>
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
        <a
          href={ep.youtube ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-cream-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-900 transition hover:bg-white"
        >
          <Play size={14} fill="currentColor" /> Ver episodio
        </a>
        <a
          href={ep.spotify ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-sm border border-cream-400/25 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-cream-100 transition hover:border-gold hover:text-gold"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[11px] text-white">
            ♪
          </span>
          Escuchar en Spotify
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
