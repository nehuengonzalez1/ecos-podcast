'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCarrito, claveDe } from './Carrito'

const precio = (pesos: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(pesos)

/**
 * El carrito, en un panel que entra desde el costado.
 *
 * Vive en el layout para que se pueda abrir desde cualquier página: quien
 * agrega algo y sigue navegando tiene que poder volver a verlo sin ir a la
 * tienda.
 */
export function PanelCarrito() {
  const { items, unidades, total, abierto, cerrar, quitar, cambiarCantidad, vaciar } = useCarrito()

  // Escape cierra. Es lo que espera cualquiera que use el teclado, y sin esto
  // el panel solo se cierra con el mouse.
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto, cerrar])

  // Con el panel abierto, la página de atrás no se mueve.
  useEffect(() => {
    if (!abierto) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = antes
    }
  }, [abierto])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        aria-label="Cerrar el carrito"
        onClick={cerrar}
        className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-label="Carrito"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-cream-400/10 bg-ink-900 shadow-soft"
      >
        <header className="flex items-center justify-between border-b border-cream-400/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cream-50">
            <ShoppingBag size={15} className="text-gold" />
            Carrito
            {unidades > 0 && <span className="text-cream-400/70">· {unidades}</span>}
          </h2>
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="text-cream-400/70 transition hover:text-cream-50"
          >
            <X size={18} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag size={30} className="text-cream-400/30" />
            <p className="font-serif text-lg italic text-cream-200/60">
              Todavía no agregaste nada.
            </p>
            <Link href="/tienda" onClick={cerrar} className="btn-ghost">
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((it) => {
                  const clave = claveDe(it.slug, it.variante)
                  return (
                    <li key={clave} className="flex gap-3">
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-700">
                        {it.imagen && (
                          <img
                            src={it.imagen}
                            alt={it.nombre}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-cream-50">
                          {it.nombre}
                        </p>
                        {it.variante && (
                          <p className="mt-0.5 text-[11px] text-cream-400/70">{it.variante}</p>
                        )}
                        <p className="mt-1 text-xs text-gold">{precio(it.precio)}</p>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => cambiarCantidad(clave, it.cantidad - 1)}
                            aria-label="Uno menos"
                            className="flex h-6 w-6 items-center justify-center rounded-xl border border-cream-400/20 text-cream-200/80 transition hover:border-gold/50 hover:text-gold"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-xs text-cream-100">
                            {it.cantidad}
                          </span>
                          <button
                            onClick={() => cambiarCantidad(clave, it.cantidad + 1)}
                            aria-label="Uno más"
                            className="flex h-6 w-6 items-center justify-center rounded-xl border border-cream-400/20 text-cream-200/80 transition hover:border-gold/50 hover:text-gold"
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            onClick={() => quitar(clave)}
                            aria-label={`Quitar ${it.nombre}`}
                            className="ml-auto text-cream-400/50 transition hover:text-red-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <button
                onClick={vaciar}
                className="mt-6 text-[10px] uppercase tracking-[0.18em] text-cream-400/60 transition hover:text-red-300"
              >
                Vaciar el carrito
              </button>
            </div>

            <footer className="border-t border-cream-400/10 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-cream-400/70">
                  Total
                </span>
                <span className="text-xl text-gold">{precio(total)}</span>
              </div>

              {/* Todavia no hay forma de cobrar: el boton dice la verdad en vez
                  de llevar a un checkout que no existe. */}
              <button
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-xl border border-cream-400/20 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-400/60"
              >
                Finalizar compra · próximamente
              </button>
              <p className="mt-2 text-center text-[11px] text-cream-400/60">
                Falta conectar el cobro. Lo que agregues se guarda igual.
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

/** El ícono del carrito del menú, con el contador. */
export function BotonCarrito() {
  const { unidades, abrir } = useCarrito()

  return (
    <button
      onClick={abrir}
      aria-label={unidades ? `Carrito, ${unidades} productos` : 'Carrito'}
      className="relative text-cream-200/80 transition hover:text-gold"
    >
      <ShoppingBag size={18} />
      {unidades > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-ink-900">
          {unidades}
        </span>
      )}
    </button>
  )
}
