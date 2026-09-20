'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCarrito } from '@/components/tienda/Carrito'

type Grupo = { titulo: string; opciones: string[] }

/**
 * Elegir las opciones del producto y agregarlo al carrito.
 *
 * Los grupos son genéricos y no solo el talle: hoy son el talle y el color,
 * y si mañana un producto trae otro eje se suma acá sin tocar el resto. Un
 * grupo con una sola opción no se pregunta, porque no hay nada que elegir:
 * todas las remeras son negras y preguntarlo sería ruido.
 *
 * No se agrega nada hasta elegir todas las opciones que correspondan: mandar
 * un talle o un color por omisión es exactamente lo que después termina en un
 * cambio o una devolución.
 */
export function Comprar({
  slug,
  nombre,
  precio,
  imagen,
  variantes,
  colores = [],
  agotado,
}: {
  slug: string
  nombre: string
  precio: number
  imagen: string | null
  variantes: Grupo | null
  colores?: string[]
  agotado: boolean
}) {
  const { agregar } = useCarrito()
  const [elegidas, setElegidas] = useState<Record<string, string>>({})
  const [faltan, setFaltan] = useState<string[]>([])

  const grupos: Grupo[] = [
    ...(variantes?.opciones.length ? [variantes] : []),
    ...(colores.length > 1 ? [{ titulo: 'Color', opciones: colores }] : []),
  ]

  const alAgregar = () => {
    const sinElegir = grupos.filter((g) => !elegidas[g.titulo]).map((g) => g.titulo)
    if (sinElegir.length) {
      setFaltan(sinElegir)
      return
    }
    // La variante viaja como un solo texto porque es lo que el carrito usa
    // para separar líneas: la misma remera en S y en L son dos líneas.
    const variante = grupos.map((g) => elegidas[g.titulo]).join(' · ')
    agregar({ slug, nombre, precio, imagen, ...(variante ? { variante } : {}) })
  }

  return (
    <div className="mt-8">
      {grupos.map((g) => (
        <div key={g.titulo} className="mt-5 first:mt-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cream-400/70">{g.titulo}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {g.opciones.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setElegidas((prev) => ({ ...prev, [g.titulo]: o }))
                  setFaltan((prev) => prev.filter((x) => x !== g.titulo))
                }}
                aria-pressed={elegidas[g.titulo] === o}
                className={`h-10 min-w-[2.75rem] rounded-xl border px-3 text-xs transition ${
                  elegidas[g.titulo] === o
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-cream-400/20 text-cream-200/80 hover:border-gold/50'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          {faltan.includes(g.titulo) && (
            <p role="alert" className="mt-2 text-xs text-red-300">
              Elegí un {g.titulo.toLowerCase()} antes de agregar.
            </p>
          )}
        </div>
      ))}

      <button
        onClick={alAgregar}
        disabled={agotado}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cream-50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-cream-400/60 sm:w-auto sm:px-10"
      >
        <ShoppingCart size={14} />
        {agotado ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  )
}
