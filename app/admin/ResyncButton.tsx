'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'

/**
 * Reconstruye el estado local preguntándole a Mercado Pago.
 * Es la red de seguridad ante una base vaciada o un webhook perdido.
 */
export function ResyncButton() {
  const router = useRouter()
  const [estado, setEstado] = useState<'idle' | 'cargando'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  const run = async () => {
    setEstado('cargando')
    setMsg(null)
    try {
      const r = await fetch('/api/admin/resync', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error ?? 'error')
      setMsg(
        `${d.revisados} suscripciones revisadas en Mercado Pago · ${d.actualizados} actualizadas` +
          (d.sinUsuario ? ` · ${d.sinUsuario} sin usuario asociado` : ''),
      )
      router.refresh()
    } catch (e: any) {
      setMsg(`No se pudo sincronizar: ${e?.message ?? 'error'}`)
    } finally {
      setEstado('idle')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={run} className="btn-ghost" disabled={estado === 'cargando'}>
        {estado === 'cargando' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        Resincronizar desde Mercado Pago
      </button>
      {msg && <p className="text-[11px] text-cream-200/70">{msg}</p>}
    </div>
  )
}
