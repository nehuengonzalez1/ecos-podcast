'use client'

import { useState } from 'react'
import { ArrowRight, Check, Loader2, Lock } from 'lucide-react'

/**
 * Las provincias, que es lo que de verdad hace falta saber para un envío.
 *
 * Es una lista cerrada y no un campo libre a propósito: escrito a mano, el
 * mismo lugar llega como "CABA", "Capital", "Buenos Aires" y "bs as", y al
 * momento de mandar el premio hay que adivinar.
 */
const PROVINCIAS = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]

const campo =
  'w-full rounded-sm border border-cream-400/20 bg-ink-900/60 px-3.5 py-3 text-sm text-cream-100 placeholder:text-cream-400/45 transition focus:border-gold focus:outline-none'

type Estado = 'idle' | 'enviando' | 'listo' | 'error'

export function FormularioSorteo({
  slug,
  abierto,
  motivoCerrado,
}: {
  slug: string
  /** Si el sorteo admite participaciones ahora. */
  abierto: boolean
  /** Qué decir cuando no las admite. */
  motivoCerrado: string
}) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState('')
  const [acepta, setAcepta] = useState(false)

  if (!abierto) {
    return (
      <div className="card-panel">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cream-50">
          Participá
        </h2>
        <p className="body-copy mt-3 text-sm leading-relaxed text-cream-200/70">
          {motivoCerrado}
        </p>
      </div>
    )
  }

  if (estado === 'listo') {
    return (
      <div className="card-panel text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-gold">
          <Check size={20} />
        </div>
        <p className="mt-4 font-serif text-2xl leading-snug text-cream-50">Ya estás participando.</p>
        <div className="divider-line" />
        <p className="body-copy mt-2 text-sm leading-relaxed text-cream-200/70">
          Si salís sorteado te escribimos al email que dejaste. Mucha suerte.
        </p>
      </div>
    )
  }

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    setEstado('enviando')
    setError('')

    try {
      const res = await fetch('/api/sorteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          acepta,
          nombre: datos.get('nombre'),
          email: datos.get('email'),
          instagram: datos.get('instagram'),
          ciudad: datos.get('ciudad'),
          web: datos.get('web'),
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setEstado('error')
        setError(mensajeDeError(res.status, json?.error))
        return
      }

      setEstado('listo')
    } catch {
      setEstado('error')
      setError('No pudimos registrar tu participación. Probá de nuevo en un momento.')
    }
  }

  return (
    <div className="card-panel">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cream-50">Participá</h2>
      <p className="body-copy mt-1.5 text-[13px] leading-relaxed text-cream-200/70">
        Completá tus datos para participar del sorteo.
      </p>

      <form onSubmit={enviar} className="mt-5 space-y-3">
        <input name="nombre" required maxLength={80} placeholder="Nombre completo" className={campo} />
        <input
          name="email"
          type="email"
          required
          maxLength={120}
          placeholder="Email"
          className={campo}
        />
        <input
          name="instagram"
          maxLength={60}
          placeholder="Usuario de Instagram (opcional)"
          className={campo}
        />

        <select name="ciudad" required defaultValue="" className={campo}>
          <option value="" disabled>
            Ciudad de residencia
          </option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Trampa para bots: fuera de pantalla y sin foco por teclado, así que
            nadie que use el formulario de verdad puede completarlo. */}
        <input
          name="web"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[12px] leading-relaxed text-cream-200/75">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-gold"
          />
          <span>
            Acepto los <span className="text-gold">términos y condiciones</span> del sorteo.
          </span>
        </label>

        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-cream-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {estado === 'enviando' ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Enviando…
            </>
          ) : (
            <>
              Participar <ArrowRight size={14} />
            </>
          )}
        </button>

        {estado === 'error' && (
          <p role="alert" className="text-xs leading-relaxed text-red-300">
            {error}
          </p>
        )}

        <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-cream-400/60">
          <Lock size={11} /> Tus datos están seguros.
        </p>
      </form>
    </div>
  )
}

function mensajeDeError(status: number, codigo?: string): string {
  if (codigo === 'ya-participaste') {
    return 'Con ese email ya estás participando de este sorteo. Una sola vez por persona.'
  }
  if (codigo === 'sorteo-finalizado') return 'Este sorteo ya cerró.'
  if (codigo === 'sorteo-proximo') return 'Este sorteo todavía no abrió.'
  if (codigo === 'faltan-condiciones') return 'Tenés que aceptar los términos y condiciones.'
  if (codigo === 'email-invalido') return 'Revisá el email que escribiste.'
  if (codigo === 'falta-nombre') return 'Necesitamos tu nombre completo.'
  if (codigo === 'falta-ciudad') return 'Elegí tu provincia.'
  if (codigo === 'sorteos-inactivos') {
    return 'Los sorteos no están disponibles en este momento. Probá más tarde.'
  }
  if (status === 429) return 'Probaste varias veces seguidas. Esperá un rato.'
  return 'No pudimos registrar tu participación. Probá de nuevo en un momento.'
}
