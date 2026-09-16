'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

type Props = {
  price?: number
  className?: string
  label?: string
  /** Clases del boton. Sin esto queda el .btn-gold de siempre. */
  clasesBoton?: string
  /** Dibujo a la izquierda del texto, para que el boton pueda
      cambiar de aspecto sin tocar la logica de cobro. */
  icono?: React.ReactNode
}

export function SubscribeButton({ price, className, label, clasesBoton, icono }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mp/create-preapproval', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando la suscripción')
      if (!data.init_point) throw new Error('MP no devolvió init_point')
      window.location.href = data.init_point
    } catch (e: any) {
      setError(e?.message ?? 'Error')
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <button onClick={start} disabled={loading} className={clasesBoton ?? 'btn-gold'}>
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          (icono ?? <Sparkles size={14} />)
        )}
        {label ?? `Suscribirme${price ? ` · $${price.toLocaleString('es-AR')}/mes` : ''}`}
      </button>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  )
}
