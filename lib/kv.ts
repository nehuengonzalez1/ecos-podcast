import Redis from 'ioredis'
import { createClient } from '@vercel/kv'

/**
 * Adaptador de Redis tolerante a cómo esté provisionada la base.
 *
 * Hay dos formas de conectarse y no son intercambiables:
 *
 *  - REDIS_URL          -> protocolo nativo de Redis por TCP. Es lo que
 *                          inyecta la integración de Redis del Marketplace
 *                          de Vercel. Se usa con ioredis.
 *  - KV_REST_API_URL    -> API REST sobre HTTP. Es lo que inyecta Upstash
 *    + KV_REST_API_TOKEN   y lo único que entiende @vercel/kv.
 *
 * El proyecto arrancó asumiendo la segunda y se provisionó la primera, así
 * que las operaciones fallaban en silencio. Acá soportamos ambas.
 *
 * Se expone una interfaz mínima con los métodos que usa la app. Sobre
 * ioredis agregamos la (de)serialización JSON que @vercel/kv hace sola,
 * para que ambos caminos se comporten igual.
 */

const redisUrl = process.env.REDIS_URL
const restUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const restToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export type KvClient = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<unknown>
  lpush(key: string, value: string): Promise<unknown>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  keys(pattern: string): Promise<string[]>
}

/**
 * En serverless cada invocación puede reusar el mismo proceso, así que
 * guardamos la conexión a nivel de módulo en vez de abrir una por request.
 */
let tcp: Redis | null = null
function getTcp(): Redis {
  if (!tcp) {
    tcp = new Redis(redisUrl!, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      // Redis Cloud y Upstash exigen TLS cuando la URL es rediss://
      ...(redisUrl!.startsWith('rediss://') ? { tls: {} } : {}),
    })
    tcp.on('error', (e) => console.error('[redis] error de conexión:', e.message))
  }
  return tcp
}

function tcpClient(): KvClient {
  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await getTcp().get(key)
      if (raw === null) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return raw as unknown as T
      }
    },
    set: (key, value) => getTcp().set(key, JSON.stringify(value)),
    lpush: (key, value) => getTcp().lpush(key, value),
    lrange: (key, start, stop) => getTcp().lrange(key, start, stop),
    keys: (pattern) => getTcp().keys(pattern),
  }
}

function restClient(): KvClient {
  const c = createClient({ url: restUrl!, token: restToken! })
  return {
    get: <T,>(key: string) => c.get<T>(key),
    set: (key, value) => c.set(key, value),
    lpush: (key, value) => c.lpush(key, value),
    lrange: (key, start, stop) => c.lrange(key, start, stop),
    keys: (pattern) => c.keys(pattern),
  }
}

export const KV_ACTIVE = !!redisUrl || !!(restUrl && restToken)

export const kv: KvClient | null = redisUrl
  ? tcpClient()
  : restUrl && restToken
    ? restClient()
    : null

/** Qué mecanismo está en uso. Para diagnóstico: no expone credenciales. */
export function kvSource(): 'REDIS_URL (TCP)' | 'KV_REST_API_* (HTTP)' | 'sin configurar' {
  if (redisUrl) return 'REDIS_URL (TCP)'
  if (restUrl && restToken) return 'KV_REST_API_* (HTTP)'
  return 'sin configurar'
}
