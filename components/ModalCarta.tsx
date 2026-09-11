'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { nombreParaHablarle } from '@/lib/utils'

/**
 * La carta del episodio.
 *
 * Se abre sobre la página, que se sigue viendo atrás: la carta es parte del
 * episodio, no un destino aparte. Antes el botón llevaba a un PDF que no
 * existía y daba 404.
 *
 * El papel es una foto y es siempre el mismo -- con el logo, el sello, la
 * polaroid y la firma ya impresos. Lo único que cambia por episodio es el
 * texto, que va montado encima como HTML y no dentro de la imagen. Por eso
 * se puede editar desde el panel de contenido sin rehacer una foto por cada
 * invitado.
 */

/**
 * Dónde cae el texto sobre el papel.
 *
 * En porcentajes y no en píxeles porque el papel se escala según la pantalla:
 * atado a la imagen, el texto la acompaña en cualquier tamaño. Los valores
 * salen de medir el área escrita de la foto.
 */
const AREA_TEXTO = { left: '11.5%', right: '33%', top: '29%', bottom: '22%' }

/** Proporción del papel, para reservarle el alto exacto y que no salte al cargar. */
const PROPORCION_PAPEL = 900 / 1305

/**
 * Ancho del papel en pantalla. El alto sale solo, de la proporción.
 *
 * Se fija el ancho y no el alto porque el contenedor tiene que respetar la
 * proporción siempre: el texto se posiciona en porcentajes del contenedor, y
 * si este deja de coincidir con la foto, `object-contain` centra la imagen
 * dejando aire y el texto queda corrido sobre el papel. Pasaba en el
 * teléfono, donde el ancho disponible es menor que el que pide el alto: la
 * carta se veía con el saludo montado sobre la polaroid.
 *
 * Los tres topes: el espacio real que hay, el que deja la altura de la
 * ventana, y el tamaño natural de la foto. Con dvh en vez de vh para que la
 * barra del navegador del teléfono, que aparece y desaparece al hacer
 * scroll, no le recorte el pie a la carta.
 */
const ANCHO_PAPEL = `min(100%, calc((100dvh - 3rem) * ${PROPORCION_PAPEL}), 566px)`

export function ModalCarta({
  abierto,
  onCerrar,
  guest,
  texto,
}: {
  abierto: boolean
  onCerrar: () => void
  guest: string
  /** Cuerpo de la carta. Los párrafos se separan con una línea en blanco. */
  texto: string
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

  const parrafos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-ink-900/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onCerrar()
      }}
    >
      {/* El botón de cerrar va en la esquina de la pantalla y no sobre el
          papel: encima de la carta taparía parte de la foto. */}
      <button
        ref={cerrarRef}
        onClick={onCerrar}
        aria-label="Cerrar la carta"
        className="fixed right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full text-cream-100/80 transition hover:bg-cream-100/10 hover:text-cream-50"
      >
        <X size={24} />
      </button>

      <div className="flex min-h-full items-center justify-center py-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-carta-titulo"
          className="relative"
          style={{ aspectRatio: String(PROPORCION_PAPEL), width: ANCHO_PAPEL }}
        >
          <img
            src="/imagenes/carta-papel.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
          />

          {/* El texto se mide contra el papel, no contra la ventana: cqw es
              un porcentaje del ancho de este contenedor. Asi la tinta escala
              junto con la hoja, como en una foto que se agranda. Atado a la
              ventana (vw), al achicarse el papel en una pantalla baja el
              texto se quedaba grande, desbordaba y aparecia una barra de
              scroll dentro de la carta. */}
          <div className="absolute overflow-y-auto" style={{ ...AREA_TEXTO, containerType: 'inline-size' }}>
            <h2
              id="modal-carta-titulo"
              className="font-serif text-[5.7cqw] text-ink-900"
            >
              {nombreParaHablarle(guest)},
            </h2>

            <div className="mt-[1.2em] space-y-[1em]">
              {parrafos.map((p, i) => (
                <p
                  key={i}
                  className="whitespace-pre-line font-serif text-[4.45cqw] leading-[1.45] text-ink-900/90"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
