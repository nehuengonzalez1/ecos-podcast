'use client'

import { useMemo, useState } from 'react'
import { SorteoCard, type SorteoTarjeta } from '@/components/SorteoCard'
import type { EstadoSorteo } from '@/lib/sorteos'

const SOLAPAS: { clave: EstadoSorteo; label: string; vacio: string }[] = [
  {
    clave: 'activo',
    label: 'Activos',
    vacio: 'No hay sorteos abiertos en este momento. Van a aparecer acá apenas se abra el próximo.',
  },
  {
    clave: 'proximo',
    label: 'Próximos',
    vacio: 'Todavía no hay sorteos anunciados.',
  },
  {
    clave: 'finalizado',
    label: 'Finalizados',
    vacio: 'Todavía no terminó ningún sorteo.',
  },
]

export function SorteosLista({
  sorteos,
  categorias,
}: {
  sorteos: SorteoTarjeta[]
  categorias: string[]
}) {
  // Arranca en la solapa que tenga algo. Abrir en "Activos" cuando no hay
  // ninguno deja la página en blanco y parece rota, aunque haya sorteos.
  const primeraConAlgo =
    SOLAPAS.find((s) => sorteos.some((x) => x.estado === s.clave))?.clave ?? 'activo'

  const [solapa, setSolapa] = useState<EstadoSorteo>(primeraConAlgo)
  const [categoria, setCategoria] = useState('')

  const visibles = useMemo(
    () =>
      sorteos.filter(
        (s) => s.estado === solapa && (categoria === '' || s.categoria === categoria),
      ),
    [sorteos, solapa, categoria],
  )

  const cuantos = (clave: EstadoSorteo) => sorteos.filter((s) => s.estado === clave).length
  const vacio = SOLAPAS.find((s) => s.clave === solapa)?.vacio ?? ''

  return (
    <section className="border-t border-cream-400/10 pb-24 pt-8">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-7">
            {SOLAPAS.map((s) => {
              const activa = solapa === s.clave
              return (
                <button
                  key={s.clave}
                  onClick={() => setSolapa(s.clave)}
                  className={`relative pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                    activa ? 'text-cream-50' : 'text-cream-400/70 hover:text-cream-200'
                  }`}
                >
                  {s.label}
                  {cuantos(s.clave) > 0 && (
                    <span className={`ml-1.5 ${activa ? 'text-gold' : 'text-cream-400/50'}`}>
                      {cuantos(s.clave)}
                    </span>
                  )}
                  {activa && <span className="absolute inset-x-0 bottom-0 h-px bg-gold" />}
                </button>
              )
            })}
          </div>

          <div className="relative">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              aria-label="Filtrar por categoría"
              className="appearance-none rounded-sm border border-cream-400/20 bg-ink-800/70 py-2.5 pl-4 pr-10 text-[11px] uppercase tracking-[0.15em] text-cream-100/85 transition focus:border-gold focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream-400/70"
            >
              ▾
            </span>
          </div>
        </div>

        <div className="mt-8">
          {visibles.length === 0 ? (
            <p className="max-w-md font-serif text-lg italic leading-relaxed text-cream-200/60">
              {categoria
                ? `No hay sorteos de ${categoria.toLowerCase()} en esta solapa.`
                : vacio}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibles.map((s, i) => (
                <SorteoCard key={s.slug} s={s} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
