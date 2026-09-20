'use client'

import { useState } from 'react'
import { Check, X, Loader2, AlertTriangle } from 'lucide-react'
import { FIRMA_ANONIMA, type Mensaje } from '@/lib/muro-publico'

/**
 * Cola de moderación del muro.
 *
 * Aprobar acá es lo único que hace que el mensaje se vea en la página. No se
 * le reenvía a nadie por mail: el muro es el lugar donde el mensaje vive.
 */

export type ItemModeracion = Mensaje & {
  /** Nombre del invitado, para no mostrar solo el slug. */
  episodio: string
}

type Resultado = { texto: string; ok: boolean }

export function MuroModeracion({ pendientes }: { pendientes: ItemModeracion[] }) {
  const [items, setItems] = useState(pendientes)
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const moderar = async (item: ItemModeracion, accion: 'aprobar' | 'rechazar') => {
    setTrabajando(item.id)
    setResultado(null)
    try {
      const res = await fetch('/api/admin/muro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, accion }),
      })
      const json = await res.json()

      if (!res.ok) {
        setResultado({ ok: false, texto: json?.error ?? 'No se pudo completar la acción.' })
        return
      }

      // Sale de la lista recién cuando el servidor confirmó: si algo falló,
      // el mensaje sigue en la cola y se puede reintentar.
      setItems((xs) => xs.filter((x) => x.id !== item.id))

      setResultado(
        accion === 'rechazar'
          ? { ok: true, texto: `Mensaje de ${item.nombre} descartado.` }
          : { ok: true, texto: `Publicado en el muro de ${item.episodio}.` },
      )
    } catch {
      setResultado({ ok: false, texto: 'Error de red. Probá de nuevo.' })
    } finally {
      setTrabajando(null)
    }
  }

  if (items.length === 0) {
    return (
      <div>
        {resultado && <Aviso resultado={resultado} />}
        <p className="text-sm text-cream-400/70">
          No hay mensajes esperando moderación.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {resultado && <Aviso resultado={resultado} />}

      {items.map((m) => {
        const ocupado = trabajando === m.id
        return (
          <div key={m.id} className="card-panel">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="font-serif text-lg text-cream-50">
                  {m.nombre}
                  {/* El nombre real se muestra acá para poder moderar, pero
                      el muro lo va a publicar como anónimo. Sin este aviso,
                      aprobar y después ver otro nombre en la página parece
                      un error del sistema. */}
                  {m.anonimo && (
                    <span className="ml-2 rounded-sm border border-cream-400/25 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cream-200/70">
                      se publica como {FIRMA_ANONIMA}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-cream-200/70">
                  Para <span className="text-cream-50">{m.episodio}</span>
                  {m.ciudad && <> · {m.ciudad}</>}
                  {m.email && (
                    <>
                      {' · '}
                      <a href={`mailto:${m.email}`} className="text-gold hover:underline">
                        {m.email}
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-cream-400/70">
                {m.at ? new Date(m.at).toLocaleString('es-AR') : ''}
              </div>
            </div>

            {/* Por qué quedó retenido. Cambia cuánto hay que mirarlo: un
                enlace se resuelve de un vistazo, una amenaza no. */}
            {m.motivo && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-gold/40 bg-gold/5 px-2 py-1 text-[11px] text-gold/90">
                <AlertTriangle size={12} className="shrink-0" />
                {m.motivo}
              </p>
            )}

            <p className="mt-3 whitespace-pre-wrap text-sm text-cream-100/90">{m.mensaje}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => moderar(m, 'aprobar')}
                disabled={ocupado}
                className="inline-flex items-center gap-2 rounded-xl border border-gold/70 bg-gold/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-cream-50 transition hover:bg-gold hover:text-ink-900 disabled:opacity-50"
              >
                {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Publicar
              </button>
              <button
                onClick={() => moderar(m, 'rechazar')}
                disabled={ocupado}
                className="inline-flex items-center gap-2 rounded-xl border border-cream-400/25 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-cream-200/70 transition hover:border-red-400/60 hover:text-red-300 disabled:opacity-50"
              >
                <X size={13} /> Descartar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Aviso({ resultado }: { resultado: Resultado }) {
  return (
    <p
      role="status"
      className={`rounded-sm border px-3 py-2 text-xs ${
        resultado.ok
          ? 'border-gold/40 bg-gold/5 text-cream-200/90'
          : 'border-red-400/50 bg-red-400/5 text-red-300'
      }`}
    >
      {resultado.texto}
    </p>
  )
}
