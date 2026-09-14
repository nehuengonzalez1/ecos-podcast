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
