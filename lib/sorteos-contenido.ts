import { kv } from '@/lib/kv'
import { slugify } from '@/lib/utils'
import { hoyEnArgentina } from '@/lib/utils'

/**
 * Las ediciones de los sorteos.
 *
 * Mismo esquema que el contenido de los episodios y por el mismo motivo: en
 * Vercel el archivo del proyecto no se puede reescribir, así que lo editado
 * vive en Redis y se le superpone al archivo al leer.
 *
 * Todo entra en tres documentos y no en uno por sorteo. Con uno por sorteo,
 * cada visita al listado dispararía tantas lecturas como sorteos haya, que es
 * exactamente lo que hizo que el archivo de episodios tardara doce segundos
 * en abrir antes de juntarlo en un solo documento.
 */

const CLAVE = 'sorteos:ediciones'
const CLAVE_NUEVOS = 'sorteos:nuevos'
const CLAVE_OCULTOS = 'sorteos:ocultos'

/**
 * Campos que el panel puede tocar. El resto se ignora aunque llegue.
 *
 * El `slug` queda deliberadamente afuera: es la URL del sorteo y, sobre todo,
 * la clave bajo la que se guardan las participaciones. Cambiarlo dejaría a
 * todos los anotados colgando de un sorteo que ya no existe.
 */
export const CAMPOS_EDITABLES = [
  'titulo',
  'categoria',
  'resumen',
  'imagen',
  'cierra',
  'abre',
  'ganadores',
  'lugar',
  'descripcion',
  'nota',
  'incluye',
  'condiciones',
] as const

export type CampoEditable = (typeof CAMPOS_EDITABLES)[number]
export type Override = Partial<Record<CampoEditable, any>>

export const SORTEOS_EDITABLES = !!kv

export async function todosLosOverrides(): Promise<Record<string, Override>> {
  if (!kv) return {}
  try {
    return (await kv.get<Record<string, Override>>(CLAVE)) ?? {}
  } catch (e) {
    console.error('[sorteos] no se pudieron leer las ediciones:', e)
    return {}
  }
}

/**
 * Superpone la edición sobre el sorteo del archivo.
 *
 * Las listas -- descripción, qué incluye, condiciones -- se reemplazan
 * enteras y no se fusionan elemento por elemento. Fusionarlas volvería
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
 * Vacío significa vacío, igual que en los episodios: si se borra un campo,
 * queda borrado en el sitio. `null` y `undefined` son otra cosa -- "no vino
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

/** Borra las ediciones de un sorteo: vuelve entero al archivo. */
export async function restaurar(slug: string): Promise<boolean> {
  if (!kv) return false
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}

/** Sorteos creados desde el panel. Son el sorteo entero, no una edición. */
export async function sorteosNuevos(): Promise<any[]> {
  if (!kv) return []
  try {
    return (await kv.get<any[]>(CLAVE_NUEVOS)) ?? []
  } catch (e) {
    console.error('[sorteos] no se pudieron leer los sorteos nuevos:', e)
    return []
  }
}

/**
 * Crea un sorteo y devuelve su slug.
 *
 * Nace cerrado -- con la fecha de cierre en el pasado -- y no abierto. Así
 * aparece en el panel para completarlo con calma sin que nadie se pueda
 * anotar a algo a medio cargar, sin premio definido y sin condiciones
 * escritas. Se abre poniéndole una fecha de cierre futura cuando está listo.
 *
 * El slug sale del título y, si ya existe, se le agrega un número. Tiene que
 * ser único contra el archivo y contra los creados antes: es la clave bajo la
 * que se guardan las participaciones, así que dos sorteos con el mismo slug
 * compartirían los anotados.
 */
export async function crearSorteo(
  titulo: string,
  slugsUsados: string[],
): Promise<{ slug: string } | null> {
  if (!kv) return null

  const nuevos = await sorteosNuevos()
  const ocupados = new Set([...slugsUsados, ...nuevos.map((s) => s.slug)])

  const base = slugify(titulo) || 'sorteo'
  let slug = base
  let n = 2
  while (ocupados.has(slug)) slug = `${base}-${n++}`

  const sorteo = {
    slug,
    titulo,
    categoria: '',
    resumen: '',
    imagen: null,
    // Nace en el pasado para que arranque cerrado.
    cierra: `${hoyEnArgentina()}T00:00:00-03:00`,
    abre: null,
    ganadores: 1,
    lugar: 'Buenos Aires, Argentina',
    descripcion: [],
    nota: null,
    incluye: [],
    condiciones: [],
    creadoEnPanel: true,
  }

  await kv.set(CLAVE_NUEVOS, [...nuevos, sorteo])
  return { slug }
}

/** Borra un sorteo creado en el panel. Los del archivo no se tocan. */
export async function borrarSorteo(slug: string): Promise<boolean> {
  if (!kv) return false
  const nuevos = await sorteosNuevos()
  await kv.set(
    CLAVE_NUEVOS,
    nuevos.filter((s) => s.slug !== slug),
  )
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}

/**
 * Sorteos del archivo escondidos del sitio.
 *
 * Los del archivo viven dentro del build y no se pueden borrar de verdad, así
 * que se marcan: para quien visita desaparecen igual, y en el panel siguen a
 * la vista para poder recuperarlos.
 *
 * Las participaciones NO se borran al esconder un sorteo. Alguien que se
 * anotó sigue teniendo derecho a que su participación exista, y esconder algo
 * por error no debería costar la lista entera.
 */
export async function sorteosOcultos(): Promise<string[]> {
  if (!kv) return []
  try {
    return (await kv.get<string[]>(CLAVE_OCULTOS)) ?? []
  } catch (e) {
    console.error('[sorteos] no se pudieron leer los ocultos:', e)
    return []
  }
}

export async function ocultarSorteo(slug: string): Promise<boolean> {
  if (!kv) return false
  const ocultos = await sorteosOcultos()
  if (!ocultos.includes(slug)) await kv.set(CLAVE_OCULTOS, [...ocultos, slug])
  return true
}

export async function mostrarSorteo(slug: string): Promise<boolean> {
  if (!kv) return false
  const ocultos = await sorteosOcultos()
  await kv.set(
    CLAVE_OCULTOS,
    ocultos.filter((s) => s !== slug),
  )
  return true
}
