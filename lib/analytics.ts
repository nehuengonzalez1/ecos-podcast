import { kv } from '@/lib/kv'

/**
 * Analítica de uso del contenido.
 *
 * Guarda dos cosas separadas, con propósitos distintos:
 *
 *  1. Contadores agregados por episodio y por tipo de acción. Es lo que
 *     responde "qué contenido funciona". No identifica a nadie.
 *  2. Últimas acciones por usuario. Es lo que responde "qué hace este
 *     suscriptor". Se guarda acotado (últimas 50) para que no crezca sin
 *     límite: no es un historial completo, es actividad reciente.
 *
 * Todo es best-effort: si la base falla, la analítica se pierde pero la
 * navegación del usuario nunca se ve afectada.
 */

export type Accion = 'episodio' | 'carta' | 'audio' | 'regalos' | 'playlist'

export const ACCIONES: Accion[] = ['episodio', 'carta', 'audio', 'regalos', 'playlist']

export type ActividadUsuario = {
  at: string
  accion: Accion
  slug: string
}

const kTotal = (accion: Accion) => `stats:accion:${accion}`
const kEpisodio = (slug: string, accion: Accion) => `stats:ep:${slug}:${accion}`
const kEpisodiosVistos = 'stats:episodios'
const kActividad = (userId: string) => `act:${userId}`

export async function registrar(
  accion: Accion,
  slug: string,
  userId?: string | null,
): Promise<void> {
  if (!kv) return
  try {
    await Promise.all([
      kv.incr(kTotal(accion)),
      kv.incr(kEpisodio(slug, accion)),
      // Set de slugs vistos, para no tener que escanear claves después.
      kv.sadd(kEpisodiosVistos, slug),
      userId
        ? kv
            .lpush(kActividad(userId), JSON.stringify({ at: new Date().toISOString(), accion, slug }))
            // Acotamos a las últimas 50 para que no crezca sin límite.
            .then(() => kv!.ltrim(kActividad(userId), 50))
        : Promise.resolve(),
    ])
  } catch (e) {
    console.error('[analytics] no se pudo registrar:', e)
  }
}

export type StatsEpisodio = {
  slug: string
  total: number
  porAccion: Record<Accion, number>
}

export async function statsPorEpisodio(): Promise<StatsEpisodio[]> {
  if (!kv) return []
  try {
    const slugs = await kv.smembers(kEpisodiosVistos)
    if (slugs.length === 0) return []

    const filas = await Promise.all(
      slugs.map(async (slug) => {
        const valores = await Promise.all(
          ACCIONES.map(async (a) => [a, Number((await kv!.get<string>(kEpisodio(slug, a))) ?? 0)] as const),
        )
        const porAccion = Object.fromEntries(valores) as Record<Accion, number>
        const total = Object.values(porAccion).reduce((a, b) => a + b, 0)
        return { slug, total, porAccion }
      }),
    )
    return filas.sort((a, b) => b.total - a.total)
  } catch {
    return []
  }
}

export async function totalesPorAccion(): Promise<Record<Accion, number>> {
  const vacio = Object.fromEntries(ACCIONES.map((a) => [a, 0])) as Record<Accion, number>
  if (!kv) return vacio
  try {
    const pares = await Promise.all(
      ACCIONES.map(async (a) => [a, Number((await kv!.get<string>(kTotal(a))) ?? 0)] as const),
    )
    return Object.fromEntries(pares) as Record<Accion, number>
  } catch {
    return vacio
  }
}

export async function actividadDe(userId: string, limite = 10): Promise<ActividadUsuario[]> {
  if (!kv) return []
  try {
    const raw = await kv.lrange(kActividad(userId), 0, limite - 1)
    return raw
      .map((r) => {
        try { return JSON.parse(r as string) as ActividadUsuario } catch { return null }
      })
      .filter(Boolean) as ActividadUsuario[]
  } catch {
    return []
  }
}
