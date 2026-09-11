'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Loader2, Lock, Send, MessageSquare } from 'lucide-react'
import {
  ETIQUETAS,
  LIMITES,
  MINIMO_MENSAJE,
  TIPOS,
  type MensajePublico,
  type TipoMensaje,
} from '@/lib/muro-publico'
import { tiltFromSeed } from '@/lib/utils'

/**
 * El muro de un episodio: lo que la gente le deja a quien contó su historia.
 *
 * Los mensajes se piden al montar en vez de venir renderizados desde el
 * servidor. Así la página del episodio sigue cacheándose igual que antes y
 * el muro se actualiza solo cuando alguien publica, sin recargar.
 */

const CLAVE_APOYOS = 'muro:apoyos'
const VISIBLES_AL_INICIO = 9

const inputBase =
  'w-full rounded-sm border border-cream-400/15 bg-ink-900/70 px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-400/50 transition focus:border-gold focus:outline-none'

type Estado = 'idle' | 'enviando' | 'pendiente' | 'publicado' | 'error'

export function MuroMensajes({
  slug,
  guest,
  nombreUsuario,
}: {
  slug: string
  guest: string
  /**
   * Nombre de quien tiene sesion iniciada. Si viene, el formulario no pide
   * nombre: ya lo sabemos. Es solo para mostrarlo -- quien firma el mensaje
   * lo decide el servidor a partir de la sesion, no este valor.
   */
  nombreUsuario: string | null
}) {
  const nombrePila = guest.split(' ')[0]

  const [mensajes, setMensajes] = useState<MensajePublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [activo, setActivo] = useState(true)
  const [tipo, setTipo] = useState<TipoMensaje>('apoyo')
  const [largo, setLargo] = useState(0)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState('')
  const [apoyados, setApoyados] = useState<Set<string>>(new Set())
  const [verTodos, setVerTodos] = useState(false)

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

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const datos = new FormData(form)
    setEstado('enviando')
    setError('')

    try {
      const res = await fetch('/api/muro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          tipo,
          nombre: datos.get('nombre'),
          ciudad: datos.get('ciudad'),
          mensaje: datos.get('mensaje'),
          web: datos.get('web'),
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setEstado('error')
        setError(mensajeDeError(res.status, json?.error))
        return
      }

      form.reset()
      setLargo(0)
      setTipo('apoyo')

      if (json?.mensaje) {
        setMensajes((ms) => [json.mensaje as MensajePublico, ...ms])
        setEstado('publicado')
      } else {
        setEstado('pendiente')
      }
    } catch {
      setEstado('error')
      setError('No pudimos enviar tu mensaje. Probá de nuevo en un momento.')
    }
  }

  const visibles = verTodos ? mensajes : mensajes.slice(0, VISIBLES_AL_INICIO)

  return (
    <section id="muro" className="mt-20 scroll-mt-24">
      <div className="text-center">
        <p className="eyebrow mb-3">El muro</p>
        <h2 className="title-display text-3xl leading-tight md:text-4xl">
          Dejale un mensaje a {nombrePila.toUpperCase()}
        </h2>
        <div className="divider-line" />
        <p className="body-copy mx-auto mt-4 max-w-xl text-base leading-relaxed text-cream-200/70">
          {nombrePila} contó algo que no era fácil de contar. Si algo de su historia te tocó,
          escribíselo acá: lo leemos y queda publicado en este muro, para que lo lea quien pase.
        </p>
      </div>

      {!activo ? (
        <div className="card-panel mx-auto mt-10 max-w-2xl text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 text-gold">
            <MessageSquare size={16} />
          </div>
          <p className="eyebrow mt-4">El muro abre muy pronto</p>
          <p className="mt-2 text-sm text-cream-200/70">
            Estamos terminando de prepararlo. Volvé en unos días para dejarle tu mensaje.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={enviar} className="card-panel mx-auto mt-10 max-w-2xl space-y-5">
            <div>
              <span className="eyebrow mb-3 block">¿Qué le querés decir?</span>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    aria-pressed={tipo === t}
                    className={`rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition ${
                      tipo === t
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-cream-400/15 text-cream-200/70 hover:border-gold/40 hover:text-cream-100'
                    }`}
                  >
                    {ETIQUETAS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="muro-mensaje" className="eyebrow mb-2 block">
                Tu mensaje
              </label>
              <textarea
                id="muro-mensaje"
                name="mensaje"
                required
                rows={5}
                minLength={MINIMO_MENSAJE}
                maxLength={LIMITES.mensaje}
                onChange={(e) => setLargo(e.target.value.length)}
                placeholder={`Escribile a ${nombrePila}. No hace falta que sea perfecto.`}
                className={inputBase}
              />
              <p className="mt-1 text-right text-[11px] text-cream-400/60">
                {largo} / {LIMITES.mensaje}
              </p>
            </div>

            <div className={nombreUsuario ? '' : 'grid gap-5 sm:grid-cols-2'}>
              {/* Con sesion iniciada el nombre ya lo sabemos: pedirlo de nuevo
                  seria hacerle escribir algo que la cuenta ya tiene. */}
              {!nombreUsuario && (
                <div>
                  <label htmlFor="muro-nombre" className="eyebrow mb-2 block">
                    Tu nombre
                  </label>
                  <input
                    id="muro-nombre"
                    name="nombre"
                    required
                    maxLength={LIMITES.nombre}
                    placeholder="Como querés que te lea"
                    className={inputBase}
                  />
                </div>
              )}
              <div>
                <label htmlFor="muro-ciudad" className="eyebrow mb-2 block">
                  ¿De dónde escribís? (opcional)
                </label>
                <input
                  id="muro-ciudad"
                  name="ciudad"
                  maxLength={LIMITES.ciudad}
                  placeholder="Ciudad o provincia"
                  className={inputBase}
                />
              </div>
            </div>

            {nombreUsuario && (
              <p className="text-[11px] text-cream-400/70">
                Vas a firmar como <span className="text-cream-100">{nombreUsuario}</span>, el
                nombre de tu cuenta.
              </p>
            )}

            {/* Campo trampa: invisible para una persona, irresistible para un bot. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="muro-web">No completar</label>
              <input id="muro-web" name="web" tabIndex={-1} autoComplete="off" />
            </div>

            <button type="submit" className="btn-gold w-full justify-center" disabled={estado === 'enviando'}>
              {estado === 'enviando' ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Send size={15} /> Enviar mi mensaje
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-2 text-center text-[11px] text-cream-400/70">
              <Lock size={12} />
              Leemos cada mensaje antes de publicarlo, para cuidar a quien contó su historia.
            </p>

            <div aria-live="polite">
              {estado === 'pendiente' && (
                <p className="rounded-sm border border-gold/40 bg-gold/5 p-4 text-center text-sm text-cream-100/90">
                  Recibimos tu mensaje. Lo leemos y en breve va a estar publicado en el muro de
                  {' '}{nombrePila}. Gracias por tomarte el momento.
                </p>
              )}
              {estado === 'publicado' && (
                <p className="rounded-sm border border-gold/40 bg-gold/5 p-4 text-center text-sm text-cream-100/90">
                  Listo, tu mensaje ya está en el muro. Gracias por dejarlo.
                </p>
              )}
              {estado === 'error' && (
                <p className="text-center text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
            </div>
          </form>

          <div className="mt-12">
            {cargando ? (
              <p className="text-center text-sm text-cream-400/70">Cargando mensajes…</p>
            ) : mensajes.length === 0 ? (
              <p className="mx-auto max-w-md text-center font-serif text-lg italic text-cream-200/60">
                Todavía no hay mensajes en este muro. Podés ser la primera persona en dejarle uno
                a {nombrePila}.
              </p>
            ) : (
              <>
                <p className="mb-6 text-center text-[11px] uppercase tracking-[0.25em] text-cream-400/70">
                  {mensajes.length} {mensajes.length === 1 ? 'mensaje' : 'mensajes'} para {nombrePila}
                </p>

                <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
                  {visibles.map((m, i) => (
                    <Nota
                      key={m.id}
                      m={m}
                      orden={i}
                      apoyado={apoyados.has(m.id)}
                      onApoyar={() => apoyar(m.id)}
                    />
                  ))}
                </div>

                {!verTodos && mensajes.length > VISIBLES_AL_INICIO && (
                  <div className="mt-8 text-center">
                    <button onClick={() => setVerTodos(true)} className="btn-ghost">
                      Ver los {mensajes.length} mensajes
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function Nota({
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
  const rotacion = tiltFromSeed(semilla(m.id), 1.3)

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(orden, 8) * 0.04 }}
      className="mb-5 break-inside-avoid"
    >
      <div
        className="bg-cream-50 p-5 shadow-polaroid transition-transform duration-300 hover:-translate-y-1"
        style={{ transform: `rotate(${rotacion}deg)` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
          {ETIQUETAS[m.tipo]}
        </p>

        <p className="mt-3 whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-ink-900/90">
          {m.mensaje}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-ink-900/10 pt-3">
          <div className="min-w-0">
            <p className="truncate font-hand text-2xl leading-none text-ink-900">{m.nombre}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-900/45">
              {[m.ciudad, cuando(m.at)].filter(Boolean).join(' · ')}
            </p>
          </div>

          <button
            onClick={onApoyar}
            disabled={apoyado}
            aria-label={apoyado ? 'Ya apoyaste este mensaje' : 'Apoyar este mensaje'}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
              apoyado
                ? 'border-gold/40 bg-gold/10 text-gold-dark'
                : 'border-ink-900/15 text-ink-900/55 hover:border-gold/50 hover:text-gold-dark'
            }`}
          >
            <Heart size={13} fill={apoyado ? 'currentColor' : 'none'} />
            {m.apoyos > 0 && <span>{m.apoyos}</span>}
          </button>
        </div>
      </div>
    </motion.article>
  )
}

/** Número estable a partir del id, para que cada nota se incline siempre igual. */
function semilla(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

function cuando(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function mensajeDeError(status: number, codigo?: string): string {
  if (status === 429) {
    return 'Ya dejaste varios mensajes en la última hora. Probá de nuevo más tarde.'
  }
  if (codigo === 'muro-inactivo') {
    return 'El muro todavía no está disponible. Volvé a intentarlo en un rato.'
  }
  if (codigo === 'faltan-datos') return 'Necesitamos tu nombre y un mensaje un poco más largo.'
  return 'No pudimos enviar tu mensaje. Probá de nuevo en un momento.'
}
