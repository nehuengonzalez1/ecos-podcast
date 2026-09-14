'use client'

import { useEffect, useState } from 'react'
import { textoRestante } from '@/lib/tiempo'

/**
 * Cuánto falta para que cierre un sorteo.
 *
 * El texto inicial lo calcula el servidor y llega como prop. Es a propósito:
 * si el contador arrancara vacío para calcularse recién en el navegador, la
 * página parpadearía al cargar, y si lo calculara solo en el cliente, el HTML
 * del servidor diría otra cosa y React avisaría de una discordancia. Con el
 * valor ya resuelto, el primer render coincide y después se refresca solo.
 */
export function CuentaRegresiva({
  cierra,
  inicial,
  formato = 'largo',
}: {
  cierra: string
  inicial: string
  /** 'corto' para la tarjeta ("5 días restantes"), 'largo' para la ficha. */
  formato?: 'corto' | 'largo'
}) {
  const [texto, setTexto] = useState(inicial)

  useEffect(() => {
    const actualizar = () => setTexto(textoRestante(cierra, formato))
    actualizar()
    // Cada medio minuto alcanza: la unidad más chica que se muestra son los
    // minutos, así que refrescar más seguido no cambiaría nada en pantalla.
    const t = setInterval(actualizar, 30_000)
    return () => clearInterval(t)
  }, [cierra, formato])

  return <>{texto}</>
}
