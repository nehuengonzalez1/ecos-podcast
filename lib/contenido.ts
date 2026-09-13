import { kv } from '@/lib/kv'
import { slugify, hoyEnArgentina } from '@/lib/utils'

/**
 * Ediciones de contenido hechas desde el panel.
 *
 * En Vercel el sistema de archivos es de solo lectura: data/episodes.json
 * viaja dentro del build y no se puede reescribir en caliente. Asi que lo
 * editado no reemplaza al archivo, se guarda aparte en Redis y se le
 * superpone al leer.
 *
 * De ahi que se guarde solo lo que cambio y no el episodio entero. Tiene dos
 * consecuencias buenas: un campo que nunca se toco sigue viniendo del
 * archivo, asi que corregirlo ahi sigue funcionando; y borrar la edicion de
 * un campo lo devuelve a su valor original en vez de dejarlo vacio.
 *
 * Lo que no se puede editar es `id` y `slug`. El slug es la URL del episodio
 * y ademas la clave con la que el muro guarda sus mensajes: cambiarlo
 * romperia los links publicados y dejaria los mensajes colgados de un
 * episodio que ya no existe.
 */

/**
 * Todas las ediciones viven en una sola clave, indexadas por slug.
 *
 * La primera version guardaba una clave por episodio, y la portada terminaba
 * haciendo diecinueve lecturas a Redis por visita -- una por episodio -- solo
 * para descubrir que casi ninguno estaba editado. Con un unico documento es
 * una sola lectura, y el contenido editado de un podcast entra de sobra en
 * ella.
 *
 * El costo es que guardar es leer-modificar-escribir, asi que dos ediciones
 * simultaneas podrian pisarse. Con un panel que usa una sola persona no es un
 * problema real, y la alternativa costaba una lectura por episodio en cada
 * visita al sitio.
 */
const CLAVE = 'contenido:episodios'

/** Campos que el panel puede tocar. El resto se ignora aunque llegue. */
export const CAMPOS_EDITABLES = [
  'guest',
  'role',
  'category',
  'quote',
  'shortQuote',
  'date',
  'duration',
  'location',
  'summary',
  'moments',
  'status',
  'photo',
  'youtube',
  'spotify',
  'apple',
  'carta',
  'regalo',
  'detrasDeEscena',
] as const

export type CampoEditable = (typeof CAMPOS_EDITABLES)[number]

/** Los que son objetos y se fusionan campo por campo en vez de reemplazarse. */
const ANIDADOS = new Set(['carta', 'regalo'])

export type Override = Partial<Record<CampoEditable, any>>

export const CONTENIDO_ACTIVO = !!kv

/** Todas las ediciones, de una lectura. */
export async function todosLosOverrides(): Promise<Record<string, Override>> {
  if (!kv) return {}
  try {
    return (await kv.get<Record<string, Override>>(CLAVE)) ?? {}
  } catch (e) {
    console.error('[contenido] no se pudieron leer las ediciones:', e)
    return {}
  }
}

export async function overrideDe(slug: string): Promise<Override> {
  return (await todosLosOverrides())[slug] ?? {}
}

/**
 * Superpone la edicion sobre el episodio del archivo.
 *
 * Los objetos como `carta` y `regalo` se fusionan campo por campo: si se
 * edito solo el texto de la carta, la imagen tiene que seguir siendo la que
 * estaba, no desaparecer porque el override no la menciona.
 */
export function aplicar(base: any, override: Override): any {
  if (!override || Object.keys(override).length === 0) return base

  const resultado = { ...base }
  for (const [campo, valor] of Object.entries(override)) {
    if (valor === undefined || valor === null) continue
    if (ANIDADOS.has(campo) && typeof valor === 'object' && !Array.isArray(valor)) {
      resultado[campo] = { ...(base[campo] ?? {}), ...valor }
    } else {
      resultado[campo] = valor
    }
  }
  return resultado
}

/**
 * Guarda una edicion, fusionandola con lo que ya hubiera.
 *
 * Un campo con cadena vacia se interpreta como "volver al original": se
 * saca del override en vez de guardarse vacio. Es lo que hace que el panel
 * pueda deshacer una edicion sin un boton aparte para eso.
 */
export async function guardar(slug: string, cambios: Override): Promise<Override | null> {
  if (!kv) return null

  const todos = await todosLosOverrides()
  const actual = todos[slug] ?? {}
  const nuevo: Override = { ...actual }

  for (const campo of CAMPOS_EDITABLES) {
    if (!(campo in cambios)) continue
    const valor = cambios[campo]

    const vacio =
      valor === null ||
      valor === undefined ||
      (typeof valor === 'string' && valor.trim() === '') ||
      (Array.isArray(valor) && valor.length === 0)

    if (vacio) {
      delete nuevo[campo]
      continue
    }

    if (ANIDADOS.has(campo) && typeof valor === 'object' && !Array.isArray(valor)) {
      const fusionado = { ...((actual[campo] as object) ?? {}), ...valor }
      // Dentro del objeto se aplica la misma regla: una cadena vacia saca
      // esa clave, no la guarda vacia.
      for (const [k, v] of Object.entries(fusionado)) {
        if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
          delete (fusionado as any)[k]
        }
      }
      if (Object.keys(fusionado).length === 0) delete nuevo[campo]
      else nuevo[campo] = fusionado
      continue
    }

    nuevo[campo] = valor
  }

  todos[slug] = nuevo
  await kv.set(CLAVE, todos)
  return nuevo
}

/**
 * Episodios creados desde el panel.
 *
 * Van aparte de las ediciones porque no son lo mismo: una edicion se apoya
 * sobre un episodio del archivo, y esto es el episodio entero. Tampoco pueden
 * ir a data/episodes.json, que en Vercel es de solo lectura.
 *
 * El resto del sitio no distingue entre unos y otros: `cargarEpisodios()` los
 * concatena y quedan todos iguales. La unica diferencia visible es en el
 * panel, que marca cuales se crearon aca por si alguna vez hay que borrarlos.
 */
const CLAVE_NUEVOS = 'contenido:episodios-nuevos'

export async function episodiosNuevos(): Promise<any[]> {
  if (!kv) return []
  try {
    return (await kv.get<any[]>(CLAVE_NUEVOS)) ?? []
  } catch (e) {
    console.error('[contenido] no se pudieron leer los episodios nuevos:', e)
    return []
  }
}

/**
 * Crea un episodio y devuelve su slug.
 *
 * Nace como "muy pronto" a proposito: asi aparece en el archivo como proximo
 * capitulo pero su pagina todavia no se puede abrir, y se puede ir cargando
 * de a poco sin que nadie vea una ficha a medio llenar. Se publica cambiando
 * el estado cuando esta listo.
 *
 * El slug se arma del nombre y, si ya existe, se le agrega un numero. Tiene
 * que ser unico contra el archivo *y* contra los creados antes: es la URL del
 * episodio y la clave con la que el muro guarda sus mensajes, asi que dos
 * episodios con el mismo slug compartirian los mensajes.
 */
export async function crearEpisodio(
  nombre: string,
  usados: { slugs: string[]; ids: number[]; numeros: number[] },
): Promise<{ slug: string } | null> {
  if (!kv) return null

  const nuevos = await episodiosNuevos()
  const ocupados = new Set([...usados.slugs, ...nuevos.map((e) => e.slug)])

  const base = slugify(nombre) || 'episodio'
  let slug = base
  let n = 2
  while (ocupados.has(slug)) slug = `${base}-${n++}`

  const maxId = Math.max(0, ...usados.ids, ...nuevos.map((e) => Number(e.id) || 0))
  const maxNum = Math.max(0, ...usados.numeros, ...nuevos.map((e) => Number(e.number) || 0))

  const ep = {
    id: maxId + 1,
    number: String(maxNum + 1),
    slug,
    guest: nombre,
    role: '',
    category: '',
    quote: '',
    date: hoyEnArgentina(),
    duration: '',
    location: '',
    photo: '',
    status: 'coming-soon',
    summary: '',
    moments: [],
    creadoEnPanel: true,
  }

  await kv.set(CLAVE_NUEVOS, [...nuevos, ep])
  return { slug }
}

/** Borra un episodio creado en el panel. Los del archivo no se tocan. */
export async function borrarEpisodio(slug: string): Promise<boolean> {
  if (!kv) return false
  const nuevos = await episodiosNuevos()
  await kv.set(
    CLAVE_NUEVOS,
    nuevos.filter((e) => e.slug !== slug),
  )
  // Se lleva tambien sus ediciones, para no dejarlas colgadas de un episodio
  // que ya no existe.
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}

/** Borra todas las ediciones de un episodio: vuelve entero al archivo. */
export async function restaurar(slug: string): Promise<boolean> {
  if (!kv) return false
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}
