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
 * De ahi que se guarde solo lo que cambio y no el episodio entero: un campo
 * que nunca se toco sigue viniendo del archivo, asi que corregirlo ahi sigue
 * funcionando.
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
  // El numero se asigna solo al crear, pero se puede corregir: el orden real
  // de los capitulos lo decide quien los publica, no el orden de carga.
  'number',
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
 * Vacio significa vacio. Si se borra el contenido de un campo, se guarda
 * vacio y asi queda en el sitio.
 *
 * La primera version hacia lo contrario: interpretaba el campo vacio como
 * "volver al valor del archivo", para poder deshacer una edicion sin un boton
 * aparte. Parecia practico y era una trampa -- volvia imposible dejar un
 * campo realmente en blanco. Al borrar la frase corta de un episodio para que
 * no se viera sobre el video, reaparecia al guardar, sin ninguna explicacion
 * visible.
 *
 * Deshacer sigue estando, pero como una accion que se pide a proposito:
 * el boton "Volver al original" del episodio.
 */
export async function guardar(slug: string, cambios: Override): Promise<Override | null> {
  if (!kv) return null

  const todos = await todosLosOverrides()
  const actual = todos[slug] ?? {}
  const nuevo: Override = { ...actual }

  for (const campo of CAMPOS_EDITABLES) {
    if (!(campo in cambios)) continue
    const valor = cambios[campo]

    // null y undefined no son "vacio": son "no vino nada". Se ignoran para
    // que un cuerpo mal armado no borre un campo sin querer.
    if (valor === null || valor === undefined) continue

    if (ANIDADOS.has(campo) && typeof valor === 'object' && !Array.isArray(valor)) {
      // Se fusiona con lo que ya habia: editar el texto de la carta no tiene
      // que hacer desaparecer su imagen. Las cadenas vacias de adentro se
      // guardan vacias, igual que en el resto.
      nuevo[campo] = { ...((actual[campo] as object) ?? {}), ...valor }
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

/**
 * Episodios del archivo que se sacaron del sitio.
 *
 * Los del archivo no se pueden borrar de verdad porque viven dentro del build,
 * asi que se guardan como ocultos y se filtran al leer. El resultado para
 * quien visita es el mismo -- no existen --, pero en el panel siguen a la
 * vista, apagados y con la opcion de recuperarlos.
 *
 * Es a proposito que no desaparezcan del panel: un borrado sin vuelta atras
 * sobre contenido que no se puede recrear desde ahi seria una trampa.
 */
const CLAVE_OCULTOS = 'contenido:episodios-ocultos'

export async function episodiosOcultos(): Promise<string[]> {
  if (!kv) return []
  try {
    return (await kv.get<string[]>(CLAVE_OCULTOS)) ?? []
  } catch {
    return []
  }
}

export async function ocultarEpisodio(slug: string): Promise<boolean> {
  if (!kv) return false
  const ocultos = await episodiosOcultos()
  if (!ocultos.includes(slug)) await kv.set(CLAVE_OCULTOS, [...ocultos, slug])
  return true
}

export async function mostrarEpisodio(slug: string): Promise<boolean> {
  if (!kv) return false
  const ocultos = await episodiosOcultos()
  await kv.set(
    CLAVE_OCULTOS,
    ocultos.filter((s) => s !== slug),
  )
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
