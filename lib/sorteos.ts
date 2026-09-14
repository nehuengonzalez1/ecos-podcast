import archivo from '@/data/sorteos.json'
import {
  todosLosOverrides,
  sorteosNuevos,
  sorteosOcultos,
  aplicar,
} from '@/lib/sorteos-contenido'

/**
 * Los sorteos.
 *
 * Viven en un archivo del proyecto, y lo editado desde el panel se les
 * superpone al leer, igual que con los episodios.
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
 * Los sorteos del archivo del proyecto, sin ediciones ni filtros.
 *
 * No se ordenan por fecha de cierre a proposito: el orden es una decision
 * editorial -- que se quiere poner adelante -- y ordenar por urgencia se la
 * sacaria de las manos a quien arma la pagina.
 */
export function sorteosDelArchivo(): Sorteo[] {
  return archivo as Sorteo[]
}

/**
 * Los sorteos como se ven en el sitio: los creados en el panel primero, los
 * del archivo despues, sin los escondidos y con las ediciones aplicadas.
 *
 * Es el unico camino de lectura del sitio. Que haya uno solo es lo que evita
 * que una pagina muestre el sorteo editado y otra el original.
 */
export async function cargarSorteos(): Promise<Sorteo[]> {
  const [overrides, nuevos, ocultos] = await Promise.all([
    todosLosOverrides(),
    sorteosNuevos(),
    sorteosOcultos(),
  ])

  const escondidos = new Set(ocultos)
  return [...nuevos, ...sorteosDelArchivo()]
    .filter((s) => !escondidos.has(s.slug))
    .map((s) => aplicar(s, overrides[s.slug] ?? {}) as Sorteo)
}

/**
 * Todos los sorteos con sus ediciones, escondidos incluidos.
 *
 * Es la lectura del panel, no la del sitio. El editor tiene que ver los
 * escondidos porque son justamente los que hay que poder recuperar: con la
 * lectura del sitio, sacar un sorteo por error lo volveria invisible tambien
 * para quien quiere deshacerlo.
 */
export async function cargarSorteosParaPanel(): Promise<Sorteo[]> {
  const [overrides, nuevos] = await Promise.all([todosLosOverrides(), sorteosNuevos()])
  return [...nuevos, ...sorteosDelArchivo()].map(
    (s) => aplicar(s, overrides[s.slug] ?? {}) as Sorteo,
  )
}

/** Un sorteo con sus ediciones. Excluye los escondidos, como el sitio. */
export async function buscarSorteo(slug: string): Promise<Sorteo | undefined> {
  return (await cargarSorteos()).find((s) => s.slug === slug)
}

/**
 * Un sorteo para el panel: tambien encuentra los escondidos.
 *
 * El panel opera sobre sorteos que el sitio no muestra. Un sorteo sacado del
 * sitio conserva sus anotados, y hay que poder abrirlo para verlos y para
 * sortear; con la busqueda del sitio esos sorteos responden que no existen y
 * la lista queda inalcanzable.
 */
export async function buscarSorteoParaPanel(slug: string): Promise<Sorteo | undefined> {
  return (await cargarSorteosParaPanel()).find((s) => s.slug === slug)
}

/**
 * Si el slug corresponde a algun sorteo, escondido incluido.
 *
 * Va aparte de buscarSorteo porque el panel necesita operar sobre los
 * escondidos -- para volver a mostrarlos, justamente -- y con la busqueda
 * normal esos sorteos responden que no existen.
 */
export async function existeSorteo(slug: string): Promise<boolean> {
  const nuevos = await sorteosNuevos()
  return [...nuevos, ...sorteosDelArchivo()].some((s) => s.slug === slug)
}

/** Las categorias que existen de verdad, sin repetidos y ordenadas. */
export async function categoriasDeSorteos(): Promise<string[]> {
  const vistas = new Set<string>()
  for (const s of await cargarSorteos()) {
    if (s.categoria) vistas.add(s.categoria)
  }
  return [...vistas].sort((a, b) => a.localeCompare(b, 'es'))
}
