'use client'

import { useEffect, useRef } from 'react'
import type { Accion } from '@/lib/analytics'

/**
 * Registra una acción sobre el contenido cuando el componente se monta.
 *
 * En desarrollo, React monta dos veces en modo estricto, y las
 * navegaciones del router pueden re-montar: el ref evita contar de más.
 * Se usa keepalive para que el registro sobreviva si la persona navega
 * enseguida.
 */
export function TrackView({ accion, slug }: { accion: Accion; slug: string }) {
  const enviado = useRef(false)

  useEffect(() => {
    if (enviado.current) return
    enviado.current = true
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, slug }),
      keepalive: true,
    }).catch(() => {
      // La analítica nunca debe molestar a quien está leyendo.
    })
  }, [accion, slug])

  return null
}
