'use client'

import type { Accion } from '@/lib/analytics'

/**
 * Enlace que registra la acción antes de seguir su curso.
 *
 * A diferencia de TrackView, que mide que alguien *vio* algo, esto mide
 * que alguien *lo usó*: descargó la carta, abrió el audio inédito. Es la
 * señal más valiosa, porque distingue mirar de consumir.
 *
 * No se bloquea la navegación esperando la respuesta: se dispara el
 * registro con keepalive y el navegador sigue con la descarga.
 */
export function TrackedLink({
  accion,
  slug,
  href,
  className,
  children,
}: {
  accion: Accion
  slug: string
  href: string
  className?: string
  children: React.ReactNode
}) {
  const registrar = () => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, slug }),
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <a href={href} className={className} onClick={registrar}>
      {children}
    </a>
  )
}
