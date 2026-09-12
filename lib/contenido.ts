import { kv } from '@/lib/kv'

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

/** Borra todas las ediciones de un episodio: vuelve entero al archivo. */
export async function restaurar(slug: string): Promise<boolean> {
  if (!kv) return false
  const todos = await todosLosOverrides()
  delete todos[slug]
  await kv.set(CLAVE, todos)
  return true
}
