import { kv } from '@/lib/kv'
import { slugify } from '@/lib/utils'

/**
 * Las ediciones de la tienda.
 *
 * Mismo esquema que los sorteos y los episodios: en Vercel el archivo del
 * proyecto no se puede reescribir, así que lo editado vive en Redis y se le
 * superpone al archivo al leer.
 *
 * Tres documentos y no uno por producto. Con uno por producto, cada visita a
 * la tienda dispararía tantas lecturas como productos haya.
 */

const CLAVE = 'tienda:ediciones'
const CLAVE_NUEVOS = 'tienda:nuevos'
const CLAVE_OCULTOS = 'tienda:ocultos'

/**
 * Campos que el panel puede tocar.
 *
 * El `slug` queda afuera: es la dirección del producto, y cambiarlo rompe
 * cualquier enlace que alguien haya guardado o compartido.
 */
export const CAMPOS_EDITABLES = [
  'nombre',
  'categoria',
  'resumen',
  'precio',
  'imagen',
  'descripcion',
  'variantes',
  'detalles',
  'estado',
] as const

export type CampoEditable = (typeof CAMPOS_EDITABLES)[number]
export type Override = Partial<Record<CampoEditable, any>>

export const TIENDA_EDITABLE = !!kv

export async function todosLosOverrides(): Promise<Record<string, Override>> {
  if (!kv) return {}
  try {
    return (await kv.get<Record<string, Override>>(CLAVE)) ?? {}
  } catch (e) {
    console.error('[tienda] no se pudieron leer las ediciones:', e)
    return {}
  }
}

/**
 * Superpone la edición sobre el producto del archivo.
 *
 * Todo se reemplaza entero, listas incluidas. Fusionar las listas volvería
 * imposible borrar un renglón: quedaría siempre el del archivo debajo.
 */
export function aplicar(base: any, override: Override): any {
  if (!override || Object.keys(override).length === 0) return base
  const resultado = { ...base }
  for (const [campo, valor] of Object.entries(override)) {
    if (valor === undefined) continue
    resultado[campo] = valor
  }
  return resultado
}

/**
 * Guarda una edición sobre lo que ya hubiera.
 *
 * Vacío significa vacío. `null` y `undefined` son otra cosa -- "no vino
 * nada" -- y se ignoran, para que un cuerpo mal armado no borre un campo sin
 * querer.
 */
export async function guardar(slug: string, cambios: Override): Promise<Override | null> {
  if (!kv) return null
  const todos = await todosLosOverrides()
  const actual = todos[slug] ?? {}
  const nuevo: Override = { ...actual }

  for (const campo of CAMPOS_EDITABLES) {
    if (!(campo in cambios)) continue
    const valor = cambios[campo]
    if (valor === null || valor === undefined) continue
    nuevo[campo] = valor
  }

  todos[slug] = nuevo
  await kv.set(CLAVE, todos)
  return nuevo
}

/** Borra las ediciones de un producto: vuelve entero al archivo. */
export async function restaurar(slug: string): Promise<boolean> {
  if (!kv) return false
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}

export async function productosNuevos(): Promise<any[]> {
  if (!kv) return []
  try {
    return (await kv.get<any[]>(CLAVE_NUEVOS)) ?? []
  } catch (e) {
    console.error('[tienda] no se pudieron leer los productos nuevos:', e)
    return []
  }
}

/**
 * Crea un producto y devuelve su slug.
 *
 * Nace agotado, no disponible. Así entra al catálogo para completarlo con
 * calma -- precio, fotos, descripción -- sin quedar a la venta a medio
 * cargar. Se pone disponible cuando está listo.
 */
export async function crearProducto(
  nombre: string,
  slugsUsados: string[],
): Promise<{ slug: string } | null> {
  if (!kv) return null

  const nuevos = await productosNuevos()
  const ocupados = new Set([...slugsUsados, ...nuevos.map((p) => p.slug)])

  const base = slugify(nombre) || 'producto'
  let slug = base
  let n = 2
  while (ocupados.has(slug)) slug = `${base}-${n++}`

  const producto = {
    slug,
    nombre,
    categoria: '',
    resumen: '',
    precio: 0,
    imagen: null,
    descripcion: [],
    variantes: null,
    detalles: [],
    estado: 'agotado',
    creadoEnPanel: true,
  }

  await kv.set(CLAVE_NUEVOS, [...nuevos, producto])
  return { slug }
}

/** Borra un producto creado en el panel. Los del archivo no se tocan. */
export async function borrarProducto(slug: string): Promise<boolean> {
  if (!kv) return false
  const nuevos = await productosNuevos()
  await kv.set(
    CLAVE_NUEVOS,
    nuevos.filter((p) => p.slug !== slug),
  )
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}

/**
 * Productos del archivo escondidos de la tienda.
 *
 * Los del archivo viven dentro del build y no se pueden borrar de verdad, así
 * que se marcan: para quien visita desaparecen igual, y en el panel siguen a
 * la vista para poder recuperarlos.
 */
export async function productosOcultos(): Promise<string[]> {
  if (!kv) return []
  try {
    return (await kv.get<string[]>(CLAVE_OCULTOS)) ?? []
  } catch (e) {
    console.error('[tienda] no se pudieron leer los ocultos:', e)
    return []
  }
}

export async function ocultarProducto(slug: string): Promise<boolean> {
  if (!kv) return false
  const ocultos = await productosOcultos()
  if (!ocultos.includes(slug)) await kv.set(CLAVE_OCULTOS, [...ocultos, slug])
  return true
}

export async function mostrarProducto(slug: string): Promise<boolean> {
  if (!kv) return false
  const ocultos = await productosOcultos()
  await kv.set(
    CLAVE_OCULTOS,
    ocultos.filter((p) => p !== slug),
  )
  return true
}
