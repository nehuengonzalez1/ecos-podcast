import archivo from '@/data/productos.json'
import {
  todosLosOverrides,
  productosNuevos,
  productosOcultos,
  aplicar,
} from '@/lib/tienda-contenido'

/**
 * La tienda.
 *
 * Todavía no está abierta: mientras no lo esté, quien entra ve un aviso de
 * «próximamente» y solo quien administra ve el catálogo real. Eso permite
 * armarla entera, con precios y fotos, sin que nadie de afuera la vea a medio
 * hacer.
 */

export type Producto = {
  slug: string
  nombre: string
  categoria: string
  /** La bajada corta de la tarjeta. */
  resumen: string
  /** En pesos, entero. Sin centavos a propósito: no se usan. */
  precio: number
  imagen: string | null
  descripcion: string[]
  /** Talles, colores, lo que haya. Null si el producto es uno solo. */
  variantes: { titulo: string; opciones: string[] } | null
  /** Para el filtro por color. Vacio si no aplica. */
  colores?: string[]
  detalles: string[]
  estado: 'disponible' | 'agotado'
}

/**
 * Si la tienda es visible para todo el mundo.
 *
 * Es una variable de entorno y no una constante en el código para que abrirla
 * el día que esté lista sea cambiar un valor en Vercel, sin tocar el código
 * ni esperar un deploy de por medio.
 */
export const TIENDA_PUBLICA = process.env.TIENDA_PUBLICA === '1'

/** Los productos del archivo del proyecto, sin ediciones ni filtros. */
/**
 * Los rubros de la barra de arriba, en orden.
 *
 * Es una lista fija y no sale de los productos a proposito: la barra tiene
 * que verse igual siempre, aunque un rubro se quede sin stock. Si saliera de
 * los productos, vender la ultima remera haria desaparecer Indumentaria.
 */
export const RUBROS = [
  'Indumentaria',
  'Accesorios',
  'Escritura',
  'Juegos',
  'Lifestyle',
  'Ediciones Especiales',
] as const

/** En cuantas cuotas sin interes se ofrece. */
export const CUOTAS = 3

/**
 * El valor de cada cuota, redondeado hacia arriba.
 *
 * Hacia arriba y no al mas cercano: con el redondeo comun, tres cuotas de
 * $9.333 suman $27.999 y quedan un peso por debajo del precio publicado.
 * Cobrar de menos es problema de la tienda; que el numero cierre, no.
 */
export function cuotaTexto(pesos: number): string {
  return precioTexto(Math.ceil(pesos / CUOTAS))
}

export function productosDelArchivo(): Producto[] {
  return archivo as Producto[]
}

/**
 * La tienda como se ve: los creados en el panel primero, los del archivo
 * despues, sin los escondidos y con las ediciones aplicadas.
 *
 * Es el unico camino de lectura de la tienda. Que haya uno solo es lo que
 * evita que el listado muestre el producto editado y la ficha el original.
 */
export async function cargarProductos(): Promise<Producto[]> {
  const [overrides, nuevos, ocultos] = await Promise.all([
    todosLosOverrides(),
    productosNuevos(),
    productosOcultos(),
  ])
  const escondidos = new Set(ocultos)
  return [...nuevos, ...productosDelArchivo()]
    .filter((p) => !escondidos.has(p.slug))
    .map((p) => aplicar(p, overrides[p.slug] ?? {}) as Producto)
}

/**
 * Todos los productos con sus ediciones, escondidos incluidos.
 *
 * Es la lectura del panel: el editor tiene que ver los escondidos porque son
 * justamente los que hay que poder recuperar.
 */
export async function cargarProductosParaPanel(): Promise<Producto[]> {
  const [overrides, nuevos] = await Promise.all([todosLosOverrides(), productosNuevos()])
  return [...nuevos, ...productosDelArchivo()].map(
    (p) => aplicar(p, overrides[p.slug] ?? {}) as Producto,
  )
}

export async function buscarProducto(slug: string): Promise<Producto | undefined> {
  return (await cargarProductos()).find((p) => p.slug === slug)
}

/** Si el slug corresponde a algun producto, escondido incluido. */
export async function existeProducto(slug: string): Promise<boolean> {
  const nuevos = await productosNuevos()
  return [...nuevos, ...productosDelArchivo()].some((p) => p.slug === slug)
}

/** Las categorias que existen de verdad, sin repetidos y ordenadas. */
export async function categoriasDeTienda(): Promise<string[]> {
  const vistas = new Set<string>()
  for (const p of await cargarProductos()) {
    if (p.categoria) vistas.add(p.categoria)
  }
  return [...vistas].sort((a, b) => a.localeCompare(b, 'es'))
}

/** El precio como se escribe en Argentina: $28.000, sin centavos. */
export function precioTexto(pesos: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(pesos)
}
