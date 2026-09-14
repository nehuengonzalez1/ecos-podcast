import { kv } from '@/lib/kv'
import { revisar } from '@/lib/moderacion'
import { FIRMA_ANONIMA } from '@/lib/muro-publico'
import type { Mensaje, MensajePublico, TipoMensaje } from '@/lib/muro-publico'

/**
 * Muro de mensajes de cada episodio.
 *
 * Cualquiera puede dejarle un mensaje al protagonista sin registrarse. Eso
 * es deliberado: pedir cuenta para decir "gracias por contarlo" espanta
 * justo a la gente que uno quiere que hable.
 *
 * El precio de esa apertura es que hay que moderar. Los episodios tocan
 * ansiedad, duelo y salud mental, y el muro vive en la página de alguien que
 * se expuso: un mensaje hiriente ahí no es un comentario más, es daño sobre
 * la persona que confió en nosotros.
 *
 * El equilibrio es publicar al instante y retener solo lo que el filtro de
 * `lib/moderacion` marca como agresivo. Así el muro se siente vivo -- quien
 * escribe ve su mensaje ahí mismo -- y la cola del panel queda corta, con lo
 * que de verdad hay que leer. Lo que el filtro no atrapa (una burla sin malas
 * palabras, por ejemplo) se baja después desde el panel.
 *
 * Igual que el resto del proyecto, si Redis no está configurado esto no
 * rompe: el muro se muestra en modo "muy pronto" y nadie ve un error.
 */

// Tipos y constantes viven en `muro-publico` para que el formulario los
// comparta sin arrastrar Redis al navegador. Se reexportan para que el
// servidor pueda seguir pidiéndole todo al muro desde un solo módulo.
export {
  TIPOS,
  ETIQUETAS,
  LIMITES,
  MINIMO_MENSAJE,
  FIRMA_ANONIMA,
  limpiar,
  type TipoMensaje,
  type Mensaje,
  type MensajePublico,
} from '@/lib/muro-publico'

/** Cuántos mensajes por hora admite una misma IP. */
const MAX_POR_HORA = 5

/** Tope de mensajes que guardamos por episodio, para que no crezca sin fin. */
const MAX_POR_EPISODIO = 500

/** Tope de la cola de moderación. */
const MAX_PENDIENTES = 1000

/** Si no hay base, no hay muro. Se decide una vez y se usa para degradar. */
export const MURO_ACTIVO = !!kv

/**
 * Freno de mano: todo a la cola, sin filtro.
 *
 * El muro publica al instante y solo retiene lo que el filtro marca. Si
 * alguna vez llega una ola de mensajes agresivos, MURO_MODERAR_TODO=1 vuelve
 * al modo anterior -- nada sale sin que una persona lo lea -- sin tener que
 * tocar el código ni esperar un deploy.
 */
export const MODERAR_TODO = process.env.MURO_MODERAR_TODO === '1'

const kMensaje = (id: string) => `muro:msg:${id}`
const kAprobados = (slug: string) => `muro:ep:${slug}:aprobados`
const kPendientes = 'muro:pendientes'
const kApoyos = (id: string) => `muro:apoyo:${id}`
const kRate = (ip: string) => `muro:rl:${ip}`

function nuevoId(): string {
  // El prefijo temporal hace que los ids ordenen igual que la cronología,
  // lo que ayuda a leer la base a mano cuando algo no cierra.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Límite por IP. Ante un fallo de Redis deja pasar en vez de bloquear: es
 * preferible un mensaje repetido a que el muro deje de recibir mensajes
 * porque la base tuvo un mal minuto.
 */
export async function dentroDelLimite(ip: string): Promise<boolean> {
  if (!kv || !ip) return true
  try {
    const n = await kv.incr(kRate(ip))
    if (n === 1) await kv.expire(kRate(ip), 3600)
    return n <= MAX_POR_HORA
  } catch (e) {
    console.error('[muro] no se pudo aplicar el límite por IP:', e)
    return true
  }
}

export type NuevoMensaje = {
  slug: string
  /**
   * Ya resuelto por quien llama: de la sesion si la hay, o del formulario si
   * no. Esta capa no decide eso, solo guarda lo que le dan.
   */
  nombre: string
  mensaje: string
  tipo: TipoMensaje
  ciudad?: string
  /** Solo para quien escribe sin sesion. Privado. */
  email?: string
  /** Publicar el mensaje sin el nombre. El nombre igual se guarda. */
  anonimo?: boolean
}

export async function crearMensaje(input: NuevoMensaje): Promise<Mensaje | null> {
  if (!kv) return null

  // El mensaje sale solo salvo que el filtro encuentre algo. Se revisa
  // también el nombre: un insulto puesto como firma se publica igual que si
  // estuviera en el cuerpo.
  const revision = MODERAR_TODO
    ? { retener: true, motivo: 'Moderación manual activada para todo el muro' }
    : revisar(input.mensaje, input.nombre)

  const m: Mensaje = {
    id: nuevoId(),
    slug: input.slug,
    nombre: input.nombre,
    mensaje: input.mensaje,
    tipo: input.tipo,
    ...(input.ciudad ? { ciudad: input.ciudad } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.anonimo ? { anonimo: true } : {}),
    at: new Date().toISOString(),
    estado: revision.retener ? 'pendiente' : 'aprobado',
    ...(revision.motivo ? { motivo: revision.motivo } : {}),
  }

  await kv.set(kMensaje(m.id), m)
  if (m.estado === 'aprobado') {
    await kv.lpush(kAprobados(m.slug), m.id)
    await kv.ltrim(kAprobados(m.slug), MAX_POR_EPISODIO)
  } else {
    await kv.lpush(kPendientes, m.id)
    await kv.ltrim(kPendientes, MAX_PENDIENTES)
  }
  return m
}

/**
 * Única puerta por la que un mensaje sale hacia el navegador.
 *
 * Acá se sacan los campos privados y se aplica el anonimato. Que sea un solo
 * lugar es la garantía: cualquier lectura nueva que se agregue pasa por acá y
 * no puede olvidarse de ocultar el email ni de respetar el pedido de aparecer
 * sin nombre.
 */
function aPublico(m: Mensaje, apoyos: number): MensajePublico {
  const { email: _privado, estado: _interno, motivo: _moderacion, anonimo, ...resto } = m
  return {
    ...resto,
    // El nombre real queda guardado para quien modera; lo que se publica es
    // la firma anónima.
    nombre: anonimo ? FIRMA_ANONIMA : resto.nombre,
    apoyos,
  }
}

/**
 * Los ids son punteros: si un mensaje se borró, su id puede seguir en la
 * lista. Los nulos se filtran en vez de romper la lectura del muro entero.
 */
async function hidratar(ids: string[]): Promise<MensajePublico[]> {
  const items = await Promise.all(
    ids.map(async (id) => {
      const m = await kv!.get<Mensaje>(kMensaje(id))
      if (!m) return null
      const apoyos = Number((await kv!.get<string>(kApoyos(id))) ?? 0)
      return aPublico(m, apoyos)
    }),
  )
  return items.filter(Boolean) as MensajePublico[]
}

export async function mensajesAprobados(slug: string, limite = 60): Promise<MensajePublico[]> {
  if (!kv) return []
  try {
    const ids = await kv.lrange(kAprobados(slug), 0, limite - 1)
    return await hidratar(ids)
  } catch (e) {
    console.error('[muro] no se pudieron leer los mensajes:', e)
    return []
  }
}

export async function contarAprobados(slug: string): Promise<number> {
  if (!kv) return 0
  try {
    return await kv.llen(kAprobados(slug))
  } catch {
    return 0
  }
}

/** Cola de moderación. Devuelve el mensaje entero porque solo la lee el panel. */
export async function mensajesPendientes(limite = 100): Promise<Mensaje[]> {
  if (!kv) return []
  try {
    const ids = await kv.lrange(kPendientes, 0, limite - 1)
    const items = await Promise.all(ids.map((id) => kv!.get<Mensaje>(kMensaje(id))))
    return items.filter(Boolean) as Mensaje[]
  } catch (e) {
    console.error('[muro] no se pudo leer la cola de moderación:', e)
    return []
  }
}

export async function contarPendientes(): Promise<number> {
  if (!kv) return 0
  try {
    return await kv.llen(kPendientes)
  } catch {
    return 0
  }
}

/**
 * Publica un mensaje. Devuelve el mensaje ya aprobado, o null si no existe:
 * quien llama lo usa para distinguir "publicado" de "ese id no está".
 *
 * Es idempotente: aprobar dos veces no lo duplica en el muro. Importa
 * porque el panel puede recibir dos clicks o quedar abierto en dos pestañas.
 */
export async function aprobar(id: string): Promise<Mensaje | null> {
  if (!kv) return null
  const m = await kv.get<Mensaje>(kMensaje(id))
  if (!m) return null

  if (m.estado !== 'aprobado') {
    const aprobado: Mensaje = { ...m, estado: 'aprobado' }
    await kv.set(kMensaje(id), aprobado)
    await kv.lpush(kAprobados(m.slug), id)
    await kv.ltrim(kAprobados(m.slug), MAX_POR_EPISODIO)
    await kv.lrem(kPendientes, id)
    return aprobado
  }

  await kv.lrem(kPendientes, id)
  return m
}

/** Borra un mensaje del muro y de la cola. Sirve para rechazar y para bajar. */
export async function rechazar(id: string): Promise<boolean> {
  if (!kv) return false
  const m = await kv.get<Mensaje>(kMensaje(id))
  await kv.lrem(kPendientes, id)
  if (m) await kv.lrem(kAprobados(m.slug), id)
  await kv.del(kMensaje(id))
  await kv.del(kApoyos(id))
  return true
}

/**
 * Un corazón en un mensaje ajeno. Solo cuenta sobre mensajes publicados,
 * así nadie puede usar el contador para descubrir si existe un id que
 * todavía está esperando moderación.
 */
export async function apoyar(id: string): Promise<number | null> {
  if (!kv) return null
  const m = await kv.get<Mensaje>(kMensaje(id))
  if (!m || m.estado !== 'aprobado') return null
  return await kv.incr(kApoyos(id))
}
