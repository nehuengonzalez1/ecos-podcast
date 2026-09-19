import { cargarEpisodios } from '@/lib/episodios'
import datos from '@/data/stats.json'

export type Estadistica = { label: string; value: string }

/**
 * Los números de la sección "Ya somos miles".
 *
 * Hay tres clases de dato acá y conviene distinguirlas:
 *
 * - Los que se cuentan solos, marcados con `auto` en stats.json. Hoy son las
 *   historias contadas, que salen de los episodios publicados: publicar uno
 *   desde el panel sube el número sin tocar nada.
 * - Los seguidores, que se suman de las tres redes. El valor que se muestra
 *   se calcula acá a partir del desglose que vive en stats.json, así que
 *   actualizar una red alcanza para que el total quede bien: no hay un
 *   número escrito aparte que se pueda olvidar.
 * - Los que se cargan a mano, que son el resto.
 */

/** 16741 -> "+16.7K". Sigue el formato que ya tenían los demás números. */
export function abreviar(n: number): string {
  if (n >= 1_000_000) return `+${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `+${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

/** La suma de las tres redes, según el último control anotado en los datos. */
export function totalDeSeguidores(): number {
  const s = datos.seguidores
  return s.instagram + s.tiktok + s.youtube
}

/**
 * Cuántas historias hay publicadas.
 *
 * Cuenta sobre `cargarEpisodios`, que ya mezcla lo que se edita desde el
 * panel, y no sobre el json suelto: un episodio publicado desde el panel
 * tiene que contar igual. Los que están en "próximamente" no cuentan, que es
 * lo que se pidió.
 */
export async function historiasPublicadas(): Promise<number> {
  const eps = await cargarEpisodios()
  return eps.filter((e) => e.status === 'available').length
}

/**
 * Las dos filas ya resueltas, listas para dibujar.
 *
 * Se arma en el servidor porque contar episodios necesita leer los datos y
 * las ediciones de Redis, que no existen en el navegador.
 */
export async function estadisticas(): Promise<{
  primary: Estadistica[]
  secondary: Estadistica[]
}> {
  const publicadas = await historiasPublicadas()

  const resolver = (fila: { label: string; value: string; auto?: string }[]): Estadistica[] =>
    fila.map(({ label, value, auto }) => {
      if (auto === 'episodios') return { label, value: String(publicadas) }
      if (auto === 'seguidores') return { label, value: abreviar(totalDeSeguidores()) }
      return { label, value }
    })

  return {
    primary: resolver(datos.primary),
    secondary: resolver(datos.secondary),
  }
}
