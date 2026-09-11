'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * El regalo del episodio.
 *
 * Se abre sobre la página igual que la carta, y por el mismo motivo: el
 * regalo es parte del episodio, no un destino aparte. Antes el botón llevaba
 * a /premium/<slug>/regalo, que no existía y daba 404.
 *
 * La foto viene recortada contra transparencia, así que el objeto queda
 * calado sobre la página en vez de ser un rectángulo pegado encima. Lo único
 * que se le suma es una sombra, que es lo que lo despega del fondo.
 *
 * Quieta a propósito. Hubo dos intentos antes -- la foto inclinándose con el
 * cursor, y después geometría 3D con three.js -- y los dos se descartaron:
 * desde una foto plana no se llega a que parezca un objeto de verdad, y
 * quedarse en el medio era pagar la complejidad sin el resultado. Así se ve
 * bien y no promete lo que no puede cumplir.
 */
export function ModalRegalo({
  abierto,
  onCerrar,
  imagen,
  guest,
  nota,
}: {
  abierto: boolean
  onCerrar: () => void
  imagen: string
  guest: string
  nota?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclear)
    cerrarRef.current?.focus()
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-ink-900/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onCerrar()
      }}
    >
      {/* El botón de cerrar va en la esquina de la pantalla y no sobre la
          foto: encima del objeto taparía parte de la imagen. */}
      <button
        ref={cerrarRef}
        onClick={onCerrar}
        aria-label="Cerrar el regalo"
        className="fixed right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full text-cream-100/80 transition hover:bg-cream-100/10 hover:text-cream-50"
      >
        <X size={24} />
      </button>

      <div className="flex min-h-full flex-col items-center justify-center gap-5 py-6">
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label={`El regalo de ${guest}`}>
          <img
            src={imagen}
            alt={`El regalo de ${guest}`}
            className="block max-h-[76dvh] w-auto max-w-full object-contain"
            style={{ filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.55))' }}
          />
        </div>

        {nota && (
          <p className="max-w-md px-4 text-center text-xs leading-relaxed text-cream-200/70">
            {nota}
          </p>
        )}
      </div>
    </div>
  )
}
