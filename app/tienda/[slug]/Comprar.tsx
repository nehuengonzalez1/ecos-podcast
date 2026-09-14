'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCarrito } from '@/components/tienda/Carrito'

/**
 * Elegir la variante y agregar al carrito.
 *
 * Con talles, no se agrega nada hasta elegir uno: mandar un talle por omisión
 * es exactamente lo que después termina en un cambio o una devolución.
 */
export function Comprar({
  slug,
  nombre,
  precio,
  imagen,
  variantes,
  agotado,
}: {
  slug: string
  nombre: string
  precio: number
  imagen: string | null
  variantes: { titulo: string; opciones: string[] } | null
  agotado: boolean
}) {
  const { agregar } = useCarrito()
  const [elegida, setElegida] = useState<string | null>(null)
  const [falta, setFalta] = useState(false)

  const hayQueElegir = !!variantes?.opciones.length

  const alAgregar = () => {
    if (hayQueElegir && !elegida) {
      setFalta(true)
      return
    }
    agregar({ slug, nombre, precio, imagen, ...(elegida ? { variante: elegida } : {}) })
  }

  return (
    <div className="mt-8">
      {variantes && !!variantes.opciones.length && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cream-400/70">
            {variantes.titulo}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variantes.opciones.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setElegida(o)
                  setFalta(false)
                }}
                aria-pressed={elegida === o}
                className={`h-10 min-w-[2.75rem] rounded-sm border px-3 text-xs transition ${
                  elegida === o
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-cream-400/20 text-cream-200/80 hover:border-gold/50'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          {falta && (
            <p role="alert" className="mt-2 text-xs text-red-300">
              Elegí un {variantes.titulo.toLowerCase()} antes de agregar.
            </p>
          )}
        </div>
      )}

      <button
        onClick={alAgregar}
        disabled={agotado}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-cream-50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-cream-400/60 sm:w-auto sm:px-10"
      >
        <ShoppingCart size={14} />
        {agotado ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  )
}
