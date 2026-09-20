'use client'

import { useMemo, useState } from 'react'
import { ProductoCard, type ProductoTarjeta } from '@/components/ProductoCard'

export function TiendaGrid({
  productos,
  categorias,
}: {
  productos: ProductoTarjeta[]
  categorias: string[]
}) {
  const [categoria, setCategoria] = useState('')

  const visibles = useMemo(
    () => productos.filter((p) => categoria === '' || p.categoria === categoria),
    [productos, categoria],
  )

  const chips = ['', ...categorias]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const activa = categoria === c
          return (
            <button
              key={c || 'todas'}
              onClick={() => setCategoria(c)}
              className={`rounded-xl border px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
                activa
                  ? 'border-gold/60 bg-gold/10 text-gold'
                  : 'border-cream-400/20 text-cream-200/70 hover:border-gold/40 hover:text-gold'
              }`}
            >
              {c || 'Todo'}
            </button>
          )
        })}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibles.map((p, i) => (
          <ProductoCard key={p.slug} p={p} index={i} />
        ))}
      </div>
    </div>
  )
}
