'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, X } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { LIMITES, MINIMO_MENSAJE, type MensajePublico } from '@/lib/muro-publico'

/**
 * La ventana para dejar un mensaje.
 *
 * Se abre sobre la pagina del episodio y al cerrarse devuelve a la persona
 * donde estaba: escribirle a alguien no deberia costar perder la pagina que
 * se estaba mirando.
 *
 * Que campos pide depende de si hay sesion iniciada. Con sesion, solo el
 * mensaje: el nombre ya lo tiene la cuenta. Sin sesion, nombre y email, que
 * son la unica forma de saber quien escribio si un mensaje trae problemas.
 * El email nunca se publica.
 */

const inputBase =
  'w-full rounded-sm border border-cream-400/20 bg-ink-900/60 px-3.5 py-3 text-sm text-cream-100 placeholder:text-cream-400/45 transition focus:border-gold focus:outline-none'

type Estado = 'idle' | 'enviando' | 'listo' | 'error'

export function ModalMensaje({
  abierto,
  onCerrar,
  slug,
  guest,
  nombreUsuario,
  onPublicado,
}: {
  abierto: boolean
  onCerrar: () => void
  slug: string
  guest: string
  /** Nombre de quien tiene sesion. Solo para mostrar: quien firma lo decide el servidor. */
  nombreUsuario: string | null
  /** Se llama cuando el mensaje sale publicado al instante (auto-aprobacion). */
  onPublicado: (m: MensajePublico) => void
}) {
  const nombrePila = guest.split(' ')[0]

  const [largo, setLargo] = useState(0)
  const [anonimo, setAnonimo] = useState(false)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const primerCampo = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Escape cierra, y mientras esta abierto la pagina de atras no scrollea:
  // sin esto, rodar la rueda mueve el fondo y la ventana parece despegada.
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclear)
    primerCampo.current?.focus()
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto, onCerrar])

  // Cada vez que se abre arranca limpia, para que no queden restos del envio
  // anterior a la vista.
  useEffect(() => {
    if (abierto) {
      setEstado('idle')
      setError('')
      setLargo(0)
      setAnonimo(false)
    }
  }, [abierto])

  if (!abierto) return null

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    setEstado('enviando')
    setError('')

    try {
      const res = await fetch('/api/muro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          anonimo,
          nombre: datos.get('nombre'),
          email: datos.get('email'),
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

      if (json?.mensaje) onPublicado(json.mensaje as MensajePublico)
      setEstado('listo')
    } catch {
      setEstado('error')
      setError('No pudimos enviar tu mensaje. Probá de nuevo en un momento.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink-900/85 p-4 backdrop-blur-sm"
      // Solo cierra si el click nacio en el fondo: arrastrar texto dentro del
      // panel y soltar afuera no deberia descartar lo que se estaba escribiendo.
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onCerrar()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-muro-titulo"
        className="relative my-auto w-full max-w-4xl overflow-hidden border border-cream-400/15 bg-ink-800 shadow-soft"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-cream-200/70 transition hover:bg-cream-100/10 hover:text-cream-50"
        >
          <X size={20} />
        </button>

        <div className="grid md:grid-cols-2">
          {/* La nota de papel. Decorativa: en pantallas chicas se va, para que
              el formulario no quede empujado abajo de todo. */}
          <div className="kraft relative hidden min-h-[420px] items-center justify-center p-10 md:flex">
            <div
              className="w-full max-w-[280px] rotate-[-2deg] bg-cream-50/95 px-7 py-10 text-center shadow-polaroid"
              aria-hidden="true"
            >
              <p className="font-hand text-3xl leading-tight text-ink-900/85">
                Las palabras
                <br />
                también son
                <br />
                encuentros.
              </p>
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-900/45">
                {brand.name}
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-9">
            {estado === 'listo' ? (
              <Confirmacion nombrePila={nombrePila} onCerrar={onCerrar} />
            ) : (
              <>
                <p className="eyebrow mb-3">Lo que quedó</p>
                <h2 id="modal-muro-titulo" className="font-serif text-3xl leading-tight text-cream-50">
                  Dejá tu mensaje para {nombrePila}
                </h2>
                <p className="body-copy mt-3 text-sm leading-relaxed text-cream-200/70">
                  Si esta historia te resonó, si algo de esta conversación te acompañó, te inspiró
                  o simplemente querés decirle algo, este es el lugar. Tu palabra también forma
                  parte de esta historia.
                </p>

                <form onSubmit={enviar} className="mt-7 space-y-5">
                  {nombreUsuario ? (
                    <p className="rounded-sm border border-cream-400/15 bg-ink-900/40 px-3.5 py-3 text-xs text-cream-200/80">
                      Vas a firmar como{' '}
                      <span className="text-cream-50">{nombreUsuario}</span>, el nombre de tu
                      cuenta.
                    </p>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="modal-nombre" className="eyebrow mb-2 block">
                          Tu nombre
                        </label>
                        <input
                          ref={primerCampo as React.RefObject<HTMLInputElement>}
                          id="modal-nombre"
                          name="nombre"
                          required
                          maxLength={LIMITES.nombre}
                          placeholder="Escribí tu nombre"
                          className={inputBase}
                        />
                      </div>
                      <div>
                        <label htmlFor="modal-email" className="eyebrow mb-2 block">
                          Tu email
                        </label>
                        <input
                          id="modal-email"
                          name="email"
                          type="email"
                          required
                          maxLength={LIMITES.email}
                          placeholder="tu@correo.com"
                          className={inputBase}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="modal-mensaje" className="eyebrow mb-2 block">
                      Tu mensaje
                    </label>
                    <textarea
                      ref={nombreUsuario ? (primerCampo as React.RefObject<HTMLTextAreaElement>) : undefined}
                      id="modal-mensaje"
                      name="mensaje"
                      required
                      rows={5}
                      minLength={MINIMO_MENSAJE}
                      maxLength={LIMITES.mensaje}
                      onChange={(e) => setLargo(e.target.value.length)}
                      placeholder={`Contale a ${nombrePila} qué te generó esta entrevista…`}
                      className={inputBase}
                    />
                    <p className="mt-1 text-right text-[11px] text-cream-400/60">
                      {largo}/{LIMITES.mensaje}
                    </p>
                  </div>

                  <fieldset className="space-y-2.5">
                    <legend className="sr-only">Cómo querés aparecer</legend>
                    <Opcion
                      nombre="firma"
                      elegida={!anonimo}
                      onElegir={() => setAnonimo(false)}
                      texto="Quiero publicar mi nombre"
                    />
                    <Opcion
                      nombre="firma"
                      elegida={anonimo}
                      onElegir={() => setAnonimo(true)}
                      texto="Prefiero aparecer como anónimo"
                    />
                  </fieldset>

                  {/* Campo trampa: invisible para una persona, irresistible para un bot. */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="modal-web">No completar</label>
                    <input id="modal-web" name="web" tabIndex={-1} autoComplete="off" />
                  </div>

                  <button
                    type="submit"
                    disabled={estado === 'enviando'}
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-cream-50 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900 transition hover:bg-white disabled:opacity-60"
                  >
                    {estado === 'enviando' ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Enviando…
                      </>
                    ) : (
                      <>
                        Enviar mi mensaje <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] leading-relaxed text-cream-400/60">
                    Todos los mensajes pasan por un proceso de moderación para mantener un espacio
                    respetuoso.
                  </p>

                  {estado === 'error' && (
                    <p className="text-center text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Opcion({
  nombre,
  elegida,
  onElegir,
  texto,
}: {
  nombre: string
  elegida: boolean
  onElegir: () => void
  texto: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-cream-200/85">
      {/* Se ve como casilla porque asi esta pensado el diseño, pero por debajo
          es un radio: las dos opciones se excluyen y el teclado tiene que
          poder recorrerlas como un grupo. */}
      <input
        type="radio"
        name={nombre}
        checked={elegida}
        onChange={onElegir}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 ${
          elegida ? 'border-gold bg-gold/15 text-gold' : 'border-cream-400/35 text-transparent'
        }`}
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M2 6.2 4.7 9 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {texto}
    </label>
  )
}

function Confirmacion({ nombrePila, onCerrar }: { nombrePila: string; onCerrar: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <div className="font-serif text-5xl leading-none text-gold/60">&ldquo;</div>
      <p className="mt-4 font-serif text-2xl leading-snug text-cream-50">Gracias por escribir.</p>
      <div className="divider-line" />
      <p className="body-copy mt-2 max-w-sm text-sm leading-relaxed text-cream-200/70">
        Lo leemos y en breve va a estar publicado en el muro de {nombrePila}. Gracias por tomarte
        el momento.
      </p>
      <button onClick={onCerrar} className="btn-ghost mt-7">
        Volver al episodio
      </button>
    </div>
  )
}

function mensajeDeError(status: number, codigo?: string): string {
  if (status === 429) {
    return 'Ya dejaste varios mensajes en la última hora. Probá de nuevo más tarde.'
  }
  if (codigo === 'muro-inactivo') {
    return 'El muro todavía no está disponible. Volvé a intentarlo en un rato.'
  }
  if (codigo === 'email-invalido') return 'Revisá el email que escribiste.'
  if (codigo === 'falta-nombre') return 'Necesitamos tu nombre para publicar el mensaje.'
  if (codigo === 'faltan-datos') return 'El mensaje es un poco corto.'
  return 'No pudimos enviar tu mensaje. Probá de nuevo en un momento.'
}
