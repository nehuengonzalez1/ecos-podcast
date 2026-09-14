import { kv } from '@/lib/kv'

/**
 * Quiénes se anotaron a cada sorteo.
 *
 * Son datos personales de gente que no tiene cuenta en el sitio: nombre,
 * email y a veces Instagram. Solo se leen desde el panel, y no hay ninguna
 * ruta pública que los devuelva. Ni siquiera el conteo de participantes se
 * publica: mostrar "1.240 anotados" cambia la decisión de participar y no
 * aporta nada a quien entra.
 *
 * Si no hay base configurada, el formulario avisa que no se puede participar
 * en vez de aceptar datos que no se van a guardar en ningún lado.
 */

export const SORTEOS_ACTIVOS = !!kv

/** Tope por sorteo, para que una lista no crezca sin fin. */
const MAX_POR_SORTEO = 5000

/**
 * Freno por IP, propio de los sorteos.
 *
 * Antes se reusaba el del muro, y eso estaba mal por dos motivos. Compartian
 * la misma clave, asi que escribir unos mensajes en el muro te dejaba sin
 * poder anotarte a un sorteo. Y el tope del muro -- 5 por hora -- tiene
 * sentido para texto libre, pero no aca: en redes moviles miles de personas
 * salen por la misma IP, y un sorteo es justo lo que se difunde y llega de
 * golpe desde el telefono. Con 5, los primeros cinco tapaban a todo el resto.
 *
 * El control de verdad es uno por email. Esto es solo un freno para un
 * script, no una cuota para la gente.
 */
const MAX_POR_HORA = 30
const kFreno = (ip: string) => `sorteo:rl:${ip}`

export async function dentroDelLimite(ip: string): Promise<boolean> {
  if (!kv || !ip) return true
  try {
    const n = await kv.incr(kFreno(ip))
    if (n === 1) await kv.expire(kFreno(ip), 3600)
    return n <= MAX_POR_HORA
  } catch (e) {
    // Ante un fallo del freno se deja pasar: perder participaciones reales es
    // peor que dejar entrar de mas un rato.
    console.error('[sorteos] no se pudo aplicar el limite por IP:', e)
    return true
  }
}

export type Participacion = {
  id: string
  slug: string
  nombre: string
  email: string
  instagram?: string
  ciudad: string
  at: string
}

const kParticipacion = (id: string) => `sorteo:part:${id}`
const kLista = (slug: string) => `sorteo:${slug}:participantes`
const kEmails = (slug: string) => `sorteo:${slug}:emails`

function nuevoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * El email en minúsculas y sin espacios, que es la forma en que se compara.
 *
 * Sin esto, "Ana@Gmail.com " y "ana@gmail.com" serían dos personas distintas
 * y la regla de participar una sola vez no valdría nada.
 */
function clave(email: string): string {
  return email.trim().toLowerCase()
}

export async function yaParticipo(slug: string, email: string): Promise<boolean> {
  if (!kv) return false
  try {
    const miembros = await kv.smembers(kEmails(slug))
    return miembros.includes(clave(email))
  } catch (e) {
    // Ante un fallo de lectura se deja participar. Es preferible una
    // participación repetida -- que se detecta después, al sortear -- a
    // rechazar a alguien por un mal minuto de la base.
    console.error('[sorteos] no se pudo comprobar si ya participó:', e)
    return false
  }
}

export async function anotar(
  p: Omit<Participacion, 'id' | 'at'>,
): Promise<Participacion | null> {
  if (!kv) return null

  const registro: Participacion = {
    ...p,
    email: clave(p.email),
    id: nuevoId(),
    at: new Date().toISOString(),
  }

  await kv.set(kParticipacion(registro.id), registro)
  await kv.lpush(kLista(registro.slug), registro.id)
  await kv.ltrim(kLista(registro.slug), MAX_POR_SORTEO)
  // El email va a un conjunto aparte: comprobar si alguien ya se anotó no
  // tiene por qué leer los miles de registros completos.
  await kv.sadd(kEmails(registro.slug), registro.email)

  return registro
}

/**
 * El sorteo propiamente dicho.
 *
 * Se guarda el historial completo y no solo el ultimo ganador. Volver a
 * sortear es legitimo -- el ganador no responde, o no cumple las
 * condiciones -- pero si cada sorteo pisara al anterior no quedaria forma de
 * demostrar que se sorteo una sola vez cuando salio el resultado que se
 * queria. Con el historial, cada tirada queda registrada con su fecha.
 */
export type Tirada = {
  participacionId: string
  at: string
}

const kGanadores = (slug: string) => `sorteo:${slug}:ganadores`

/** Las tiradas de un sorteo, de la mas reciente a la mas vieja. */
export async function tiradas(slug: string): Promise<Tirada[]> {
  if (!kv) return []
  try {
    const crudas = await kv.lrange(kGanadores(slug), 0, 49)
    return crudas
      .map((t) => {
        try {
          return JSON.parse(t) as Tirada
        } catch {
          return null
        }
      })
      .filter(Boolean) as Tirada[]
  } catch (e) {
    console.error('[sorteos] no se pudieron leer las tiradas:', e)
    return []
  }
}

/**
 * Elige un ganador al azar entre los anotados y deja registro.
 *
 * La eleccion se hace del lado del servidor sobre la lista completa. Hacerla
 * en el navegador, sobre lo que el panel tenga cargado en pantalla, dejaria
 * afuera a cualquiera que no hubiera entrado en la pagina mostrada.
 */
export async function sortear(slug: string): Promise<Participacion | null> {
  if (!kv) return null

  const anotados = await participantes(slug, 5000)
  if (anotados.length === 0) return null

  const elegido = anotados[Math.floor(Math.random() * anotados.length)]
  const tirada: Tirada = { participacionId: elegido.id, at: new Date().toISOString() }
  await kv.lpush(kGanadores(slug), JSON.stringify(tirada))
  await kv.ltrim(kGanadores(slug), 50)

  return elegido
}

/** Una participacion puntual, para resolver el ganador a partir de su id. */
export async function participacion(id: string): Promise<Participacion | null> {
  if (!kv) return null
  try {
    return (await kv.get<Participacion>(kParticipacion(id))) ?? null
  } catch {
    return null
  }
}

/** Los anotados a un sorteo. Solo para el panel. */
export async function participantes(slug: string, limite = 1000): Promise<Participacion[]> {
  if (!kv) return []
  try {
    const ids = await kv.lrange(kLista(slug), 0, limite - 1)
    const items = await Promise.all(ids.map((id) => kv!.get<Participacion>(kParticipacion(id))))
    return items.filter(Boolean) as Participacion[]
  } catch (e) {
    console.error('[sorteos] no se pudieron leer los participantes:', e)
    return []
  }
}

export async function contarParticipantes(slug: string): Promise<number> {
  if (!kv) return 0
  try {
    return await kv.llen(kLista(slug))
  } catch {
    return 0
  }
}
