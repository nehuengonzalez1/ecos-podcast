'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Heart } from 'lucide-react'
import { type MensajePublico } from '@/lib/muro-publico'
import { ModalMensaje } from '@/components/ModalMensaje'

/**
 * El muro de un episodio, partido en las dos piezas que pide el diseño.
 *
 * La invitacion a escribir vive arriba, junto al resumen del episodio, y lo
 * que ya dejaron otros vive al pie de la pagina. Estan lejos en pantalla pero
 * comparten un mismo estado: la lista de mensajes, el contador y la ventana
 * para escribir. Por eso el estado vive en un proveedor que envuelve a los
 * dos, en vez de duplicarse -- si cada mitad pidiera los mensajes por su
 * cuenta, el contador de arriba y la lista de abajo podrian mostrar cosas
 * distintas, y un mensaje recien enviado aparecería en una sola.
 */

const CLAVE_APOYOS = 'muro:apoyos'
const VISIBLES_AL_INICIO = 5

type Muro = {
  mensajes: MensajePublico[]
  cargando: boolean
  activo: boolean
  apoyados: Set<string>
  apoyar: (id: string) => void
  abrirModal: () => void
  nombrePila: string
}

const MuroContext = createContext<Muro | null>(null)

function useMuro(): Muro {
  const ctx = useContext(MuroContext)
  if (!ctx) throw new Error('Falta <MuroProvider> alrededor de esta parte del muro')
  return ctx
}

export function MuroProvider({
  slug,
  guest,
  nombreUsuario,
  children,
}: {
  slug: string
  guest: string
  /**
   * Nombre de quien tiene sesión iniciada. Si viene, la ventana no pide
   * nombre ni email. Es solo para mostrar — quién firma el mensaje lo decide
   * el servidor a partir de la sesión, no este valor.
   */
  nombreUsuario: string | null
  children: React.ReactNode
}) {
  const nombrePila = guest.split(' ')[0]

  const [mensajes, setMensajes] = useState<MensajePublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [activo, setActivo] = useState(true)
  const [apoyados, setApoyados] = useState<Set<string>>(new Set())
  const [modalAbierto, setModalAbierto] = useState(false)

  // localStorage se lee después del montaje: durante el render inicial el
  // servidor no lo tiene y React se quejaría de que el HTML no coincide.
  useEffect(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem(CLAVE_APOYOS) ?? '[]')
      if (Array.isArray(guardados)) setApoyados(new Set(guardados))
    } catch {
      /* si el navegador bloquea el storage, se puede apoyar igual */
    }
  }, [])

  useEffect(() => {
    let vigente = true
    ;(async () => {
      try {
        const res = await fetch(`/api/muro?slug=${encodeURIComponent(slug)}`)
        const json = await res.json()
        if (!vigente) return
        setMensajes(Array.isArray(json?.mensajes) ? json.mensajes : [])
        setActivo(json?.activo !== false)
      } catch {
        if (vigente) setActivo(false)
      } finally {
        if (vigente) setCargando(false)
      }
    })()
    // Evita que una respuesta lenta de un episodio anterior pise la lista
    // cuando alguien navega rápido entre capítulos.
    return () => {
      vigente = false
    }
  }, [slug])

  const apoyar = useCallback(
    async (id: string) => {
      if (apoyados.has(id)) return

      // Optimista: el corazón responde al toque y la red se pone al día
      // después. Si falla, el contador real vuelve al recargar.
      setApoyados((prev) => {
        const siguiente = new Set(prev).add(id)
        try {
          localStorage.setItem(CLAVE_APOYOS, JSON.stringify([...siguiente]))
        } catch {
          /* sin storage el corazón se puede repetir; no es grave */
        }
        return siguiente
      })
      setMensajes((ms) => ms.map((m) => (m.id === id ? { ...m, apoyos: m.apoyos + 1 } : m)))

      try {
        const res = await fetch('/api/muro/apoyo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        const json = await res.json()
        if (typeof json?.apoyos === 'number') {
          setMensajes((ms) => ms.map((m) => (m.id === id ? { ...m, apoyos: json.apoyos } : m)))
        }
      } catch {
        /* el conteo se corrige en la próxima carga */
      }
    },
    [apoyados],
  )

  const valor: Muro = {
    mensajes,
    cargando,
    activo,
    apoyados,
    apoyar,
    abrirModal: () => setModalAbierto(true),
    nombrePila,
  }

  return (
    <MuroContext.Provider value={valor}>
      {children}
      <ModalMensaje
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        slug={slug}
        guest={guest}
        nombreUsuario={nombreUsuario}
        onPublicado={(m) => setMensajes((ms) => [m, ...ms])}
      />
    </MuroContext.Provider>
  )
}

/** La invitación a escribir. Va arriba, junto al resumen del episodio. */
export function DejaTuMensaje() {
  const { mensajes, activo, abrirModal, nombrePila } = useMuro()

  return (
    <div>
      <p className="eyebrow mb-2.5">Dejá tu mensaje</p>
      <p className="body-copy text-[13px] leading-relaxed text-cream-200/70">
        Si esta historia te resonó, podés dejarle
        <br className="hidden sm:block" /> un mensaje a {nombrePila}.
      </p>

      <button
        onClick={abrirModal}
        disabled={!activo}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-cream-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Dejar un mensaje <ArrowRight size={14} />
      </button>

      {activo && mensajes.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-cream-200/60">
          <span className="text-cream-50">{mensajes.length}</span>{' '}
          {mensajes.length === 1 ? 'persona ya le dejó' : 'personas ya le dejaron'} algo.
        </p>
      )}
    </div>
  )
}

/** Lo que ya dejaron otros. Va al pie de la página. */
export function LoQueQuedo() {
  const { mensajes, cargando, activo, apoyados, apoyar, nombrePila } = useMuro()
  const [verTodos, setVerTodos] = useState(false)

  const visibles = verTodos ? mensajes : mensajes.slice(0, VISIBLES_AL_INICIO)

  return (
    <section id="muro" className="mt-8 scroll-mt-24 border-t border-cream-400/10 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 className="text-sm uppercase tracking-[0.25em] text-gold">Lo que quedó</h2>
          {mensajes.length > 0 && (
            <span className="text-xs text-cream-200/60">
              {mensajes.length} {mensajes.length === 1 ? 'mensaje' : 'mensajes'} de la comunidad.
            </span>
          )}
        </div>

        {!verTodos && mensajes.length > VISIBLES_AL_INICIO && (
          <button onClick={() => setVerTodos(true)} className="btn-ghost">
            Ver más mensajes <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="mt-5">
        {cargando ? (
          <p className="text-sm text-cream-400/70">Cargando mensajes…</p>
        ) : !activo ? (
          <p className="text-sm text-cream-400/70">El muro abre muy pronto. Volvé en unos días.</p>
        ) : mensajes.length === 0 ? (
          <p className="max-w-md font-serif text-lg italic text-cream-200/60">
            Todavía no hay mensajes acá. Podés ser la primera persona en dejarle uno a {nombrePila}.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visibles.map((m, i) => (
              <Tarjeta
                key={m.id}
                m={m}
                orden={i}
                apoyado={apoyados.has(m.id)}
                onApoyar={() => apoyar(m.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Tarjeta({
  m,
  orden,
  apoyado,
  onApoyar,
}: {
  m: MensajePublico
  orden: number
  apoyado: boolean
  onApoyar: () => void
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(orden, 6) * 0.05 }}
      className="flex flex-col justify-between border border-cream-400/10 bg-ink-800/50 p-4"
    >
      <p className="whitespace-pre-wrap font-serif text-sm italic leading-relaxed text-cream-100/85">
        &ldquo;{m.mensaje}&rdquo;
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-cream-50">{m.nombre}</p>
          <p className="mt-0.5 text-[11px] text-cream-400/60">{cuando(m.at)}</p>
        </div>

        <button
          onClick={onApoyar}
          disabled={apoyado}
          aria-label={apoyado ? 'Ya apoyaste este mensaje' : 'Apoyar este mensaje'}
          className={`flex shrink-0 items-center gap-1.5 text-xs transition ${
            apoyado ? 'text-gold' : 'text-cream-400/70 hover:text-gold'
          }`}
        >
          <Heart size={13} fill={apoyado ? 'currentColor' : 'none'} />
          {m.apoyos > 0 && <span>{m.apoyos}</span>}
        </button>
      </div>
    </motion.article>
  )
}

function cuando(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}
