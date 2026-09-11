'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { X, RotateCcw } from 'lucide-react'

/**
 * El visor 3D se carga aparte y solo en el navegador.
 *
 * three.js son unos cientos de kB que no tienen por qué viajar con la página
 * del episodio: la mayoría de la gente nunca abre un regalo. Con `dynamic` se
 * descarga recién cuando este modal se monta, o sea cuando alguien lo pidió.
 */
const RegaloTresD = dynamic(() => import('./RegaloTresD').then((m) => m.RegaloTresD), {
  ssr: false,
})

/**
 * El regalo del episodio.
 *
 * Se abre sobre la página igual que la carta, y por el mismo motivo: el
 * regalo es parte del episodio, no un destino aparte. Antes el botón llevaba
 * a /premium/<slug>/regalo, que no existía y daba 404.
 *
 * La foto viene recortada, sin fondo, así que el objeto queda calado sobre la
 * página en vez de ser un rectángulo pegado encima.
 *
 * Sobre el 3D: la foto es una sola, así que el objeto no se puede girar de
 * verdad -- no existe el reverso. Lo que se hace es inclinarlo en el espacio,
 * con perspectiva real, siguiendo el dedo o el cursor, con un brillo que
 * barre la superficie y una sombra que acompaña. Se siente como sostenerlo y
 * moverlo contra la luz. No pretende ser un modelo: pretende ser un objeto.
 *
 * Todo con transformaciones CSS, sin librería 3D: son ~600 kB que nadie
 * deberia descargar para mirar una foto.
 */

/** Cuánto se inclina, en grados, de un extremo al otro del recorrido. */
const INCLINACION_MAX = 16

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
  const objetoRef = useRef<HTMLDivElement>(null)

  /** x e y van de -1 a 1; quieto es el centro. */
  const [giro, setGiro] = useState({ x: 0, y: 0 })
  const [tocando, setTocando] = useState(false)
  const [menosMovimiento, setMenosMovimiento] = useState(false)

  /**
   * La foto se muestra desde el primer instante y el 3D la reemplaza cuando
   * termina de armarse. Así no hay un hueco en blanco mientras carga la
   * librería, y si el equipo no tiene WebGL la foto simplemente se queda.
   */
  const [tresDListo, setTresDListo] = useState(false)
  const avisarListo = useCallback(() => setTresDListo(true), [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const leer = () => setMenosMovimiento(mq.matches)
    leer()
    mq.addEventListener('change', leer)
    return () => mq.removeEventListener('change', leer)
  }, [])

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

  // Al cerrarse vuelve al centro, así la próxima vez que se abra no aparece
  // torcido desde el ángulo en que lo dejaron.
  useEffect(() => {
    if (!abierto) {
      setGiro({ x: 0, y: 0 })
      setTocando(false)
      setTresDListo(false)
    }
  }, [abierto])

  if (!abierto) return null

  const mover = (e: React.PointerEvent) => {
    const caja = objetoRef.current?.getBoundingClientRect()
    if (!caja) return
    // Posición del puntero dentro del objeto, normalizada a -1..1.
    const x = ((e.clientX - caja.left) / caja.width) * 2 - 1
    const y = ((e.clientY - caja.top) / caja.height) * 2 - 1
    setGiro({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
  }

  const quieto = () => {
    setTocando(false)
    setGiro({ x: 0, y: 0 })
  }

  // El eje Y gira con el movimiento horizontal y el X con el vertical, pero
  // invertido: mover el puntero hacia arriba tiene que acercar el borde de
  // arriba, no alejarlo, que es como responde un objeto en la mano.
  const rotY = giro.x * INCLINACION_MAX
  const rotX = -giro.y * INCLINACION_MAX

  const transform = menosMovimiento
    ? undefined
    : `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${tocando ? 1.02 : 1})`

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-ink-900/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onCerrar()
      }}
    >
      <button
        ref={cerrarRef}
        onClick={onCerrar}
        aria-label="Cerrar el regalo"
        className="fixed right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full text-cream-100/80 transition hover:bg-cream-100/10 hover:text-cream-50"
      >
        <X size={24} />
      </button>

      <div className="flex min-h-full flex-col items-center justify-center gap-5 py-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={`El regalo de ${guest}`}
          className="relative aspect-square w-[min(88vw,560px)] max-h-[72dvh]"
        >
          {/* Dos capas sobre el mismo hueco: la foto, que aparece al
              instante, y el objeto 3D, que la releva cuando termina de
              armarse. El hueco tiene medida propia para que no haya salto
              entre una y otra. */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
              tresDListo ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            style={{ perspective: '1100px' }}
          >
            {/* La flotación va acá y la inclinación en el hijo: si compartieran
                elemento, una transformación pisaría a la otra. */}
            <div className={menosMovimiento ? '' : 'animate-float-slow'}>
              <div
                ref={objetoRef}
                onPointerMove={(e) => {
                  if (menosMovimiento) return
                  setTocando(true)
                  mover(e)
                }}
                onPointerLeave={quieto}
                onPointerCancel={quieto}
                className="relative inline-block touch-none select-none"
                style={{
                  transform,
                  transformStyle: 'preserve-3d',
                  // Sin transición mientras se lo mueve, para que siga al dedo
                  // sin retraso; con transición al soltar, para que vuelva
                  // solo y suave en vez de saltar al centro.
                  transition: tocando ? 'transform 80ms linear' : 'transform 700ms cubic-bezier(0.2,0.8,0.2,1)',
                  filter: `drop-shadow(${-rotY * 0.8}px ${12 + rotX * 0.5}px 26px rgba(0,0,0,0.55))`,
                }}
              >
                <img
                  src={imagen}
                  alt={`El regalo de ${guest}`}
                  draggable={false}
                  className="block max-h-full w-auto max-w-full object-contain"
                />

                {/* El brillo se recorta contra la silueta del objeto con una
                    máscara hecha de su propio alfa. Sin eso, el reflejo se
                    dibujaría también sobre el aire transparente de alrededor
                    y se vería el rectángulo de la foto. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                  style={{
                    background: `radial-gradient(circle at ${50 + giro.x * 42}% ${50 + giro.y * 42}%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 32%, rgba(255,255,255,0) 62%)`,
                    opacity: menosMovimiento ? 0 : tocando ? 1 : 0.55,
                    transition: 'opacity 400ms ease',
                    WebkitMaskImage: `url(${imagen})`,
                    maskImage: `url(${imagen})`,
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                  }}
                />
              </div>
            </div>
          </div>

          {/* El objeto 3D, encima. Mientras no esté listo no recibe el
              puntero, así la foto de abajo se puede seguir inclinando. */}
          <div className={`absolute inset-0 ${tresDListo ? '' : 'pointer-events-none'}`}>
            <RegaloTresD
              imagen={imagen}
              alt={`El regalo de ${guest}`}
              onListo={avisarListo}
            />
          </div>
        </div>

        <div className="max-w-md px-4 text-center">
          {nota && <p className="text-xs leading-relaxed text-cream-200/70">{nota}</p>}
          {!menosMovimiento && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cream-400/50">
              <RotateCcw size={11} /> Arrastralo para girarlo
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
