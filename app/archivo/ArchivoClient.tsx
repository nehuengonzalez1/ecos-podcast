'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { brand } from '@/lib/config/brand'
import { EpisodeCard, type Episode } from '@/components/EpisodeCard'

export function ArchivoClient({
  episodios,
  categorias,
}: {
  episodios: Episode[]
  categorias: string[]
}) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todos')

  const filtered = useMemo(() => {
    return episodios.filter((e) => {
      const inCat = cat === 'Todos' || (e as any).category === cat
      const query = q.trim().toLowerCase()
      const inQ = !query ||
        e.guest.toLowerCase().includes(query) ||
        e.quote.toLowerCase().includes(query) ||
        e.number.includes(query)
      return inCat && inQ
    })
  }, [q, cat])

  const available = filtered.filter((e) => e.status === 'available')
  const coming = filtered.filter((e) => e.status === 'coming-soon')

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-16">
        {/* El velo no es parejo como en Nosotros sino mas cerrado en el
            centro. El titulo va centrado, pero lo que cuenta esta foto esta
            en los bordes: el sillon a la izquierda y los estantes con las
            cajas numeradas por episodio a la derecha, que se encuadran al
            centro porque ancladas abajo se cortaba la fila de arriba. Un velo
            parejo lo
            suficientemente alto para que se lea el titulo borraba justo esas
            cajas, que son lo unico que dice "archivo" en la imagen. */}
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/archivo-cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 58% 68% at 50% 45%, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.7) 55%, rgba(10,10,10,0.3) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>

        <div className="container-page relative flex min-h-[20rem] flex-col justify-center text-center">
          <p className="eyebrow mb-4">Bienvenidx a</p>
          <h1 className="title-display text-5xl leading-none md:text-7xl">
            EL ARCHIVO<br />
            de {brand.name}
          </h1>
          <p className="subtitle-signature mt-6 text-3xl md:text-4xl">
            {brand.slogan}
          </p>
          <p className="body-copy mx-auto mt-4 max-w-xl text-base text-cream-200/70">
            Cada episodio deja una huella. Acá reunimos todas las historias que pasaron por {brand.name}.
          </p>
        </div>
      </section>

      <section className="border-y border-cream-400/10 bg-ink-800/40 py-6">
        <div className="container-page flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-xl border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${
                  cat === c
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-cream-400/15 text-cream-200/70 hover:border-gold/50 hover:text-cream-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-200/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar invitado o episodio..."
              className="w-full rounded-sm border border-cream-400/15 bg-ink-900/70 py-2 pl-9 pr-3 text-xs text-cream-100 placeholder:text-cream-400/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          {available.length > 0 && (
            <>
              <p className="eyebrow mb-6">Disponibles · {available.length}</p>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {available.map((e, i) => (
                  <EpisodeCard key={e.id} episode={e} index={i} />
                ))}
              </div>
            </>
          )}

          {coming.length > 0 && (
            <div className="mt-20">
              <p className="eyebrow mb-6">Próximamente</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {coming.map((e, i) => (
                  <EpisodeCard key={e.id} episode={e} index={i} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16 text-center text-sm text-cream-200/70"
            >
              No encontramos nada con esos criterios. Probá con otra búsqueda o categoría.
            </motion.p>
          )}

          <p className="mt-24 text-center font-hand text-2xl text-gold/80">
            Gracias por ser parte de estas historias que nos cambian. ♡
          </p>
        </div>
      </section>
    </>
  )
}
