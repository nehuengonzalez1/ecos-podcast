import archivo from '@/data/productos.json'

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

export function productos(): Producto[] {
  return archivo as Producto[]
}

export function buscarProducto(slug: string): Producto | undefined {
  return (archivo as Producto[]).find((p) => p.slug === slug)
}

/** Las categorías que existen de verdad, sin repetidos y ordenadas. */
export function categoriasDeTienda(): string[] {
  const vistas = new Set<string>()
  for (const p of archivo as Producto[]) {
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
