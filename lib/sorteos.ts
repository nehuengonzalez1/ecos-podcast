import archivo from '@/data/sorteos.json'

/**
 * Los sorteos.
 *
 * Viven en un archivo del proyecto, igual que los episodios. Cuando haga
 * falta editarlos desde el panel se les superpone la misma capa de overrides
 * en Redis que usa `lib/contenido`, sin tocar esta lectura.
 */

export type ItemIncluido = {
  /** Clave del icono. La traduce a un dibujo quien lo muestra. */
  icono: string
  texto: string
}

export type Sorteo = {
  slug: string
  titulo: string
  categoria: string
  /** La bajada corta de la tarjeta. */
  resumen: string
  imagen: string | null
  /** Cuando cierra, en ISO con huso. */
  cierra: string
  /**
   * Cuando se abre. Sin esto, el sorteo ya esta abierto.
   *
   * Es lo unico que distingue un sorteo "proximo" de uno activo: sin fecha de
   * apertura no habria forma de anunciar algo antes de que se pueda
   * participar.
   */
  abre?: string | null
  ganadores: number
  lugar: string
  descripcion: string[]
  /** La linea manuscrita. Opcional. */
  nota?: string | null
  incluye: ItemIncluido[]
  condiciones: string[]
}

export type EstadoSorteo = 'activo' | 'proximo' | 'finalizado'

/**
 * El estado sale de las fechas, no de un campo aparte.
 *
 * Un campo "estado" escrito a mano se desincroniza el dia que nadie entra a
 * cambiarlo: el sorteo sigue diciendo "activo" con el plazo vencido, y alguien
 * participa de algo que ya cerro.
 */
export function estadoDe(s: Sorteo, ahora: number = Date.now()): EstadoSorteo {
  const abre = s.abre ? new Date(s.abre).getTime() : null
  if (abre && !Number.isNaN(abre) && ahora < abre) return 'proximo'

  const cierra = new Date(s.cierra).getTime()
  // Una fecha ilegible no deberia esconder el sorteo: se muestra abierto y el
  // error se ve, en vez de desaparecer sin explicacion.
  if (Number.isNaN(cierra)) return 'activo'

  return ahora > cierra ? 'finalizado' : 'activo'
}

/** Cuanto falta para cerrar, en milisegundos. Negativo si ya cerro. */
export function faltaPara(s: Sorteo, ahora: number = Date.now()): number {
  const cierra = new Date(s.cierra).getTime()
  if (Number.isNaN(cierra)) return 0
  return cierra - ahora
}

/**
 * Los sorteos, en el orden en que están escritos en el archivo.
 *
 * No se ordenan por fecha de cierre a propósito: el orden es una decisión
 * editorial -- qué se quiere poner adelante -- y ordenar por urgencia se la
 * sacaría de las manos a quien arma la página.
 */
export function sorteos(): Sorteo[] {
  return archivo as Sorteo[]
}

export function buscarSorteo(slug: string): Sorteo | undefined {
  return (archivo as Sorteo[]).find((s) => s.slug === slug)
}

/** Las categorias que existen de verdad, sin repetidos y ordenadas. */
export function categoriasDeSorteos(): string[] {
  const vistas = new Set<string>()
  for (const s of archivo as Sorteo[]) {
    if (s.categoria) vistas.add(s.categoria)
  }
  return [...vistas].sort((a, b) => a.localeCompare(b, 'es'))
}
