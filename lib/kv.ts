import { createClient } from '@vercel/kv'

/**
 * Cliente Redis tolerante al nombre de las variables.
 *
 * @vercel/kv solo lee KV_REST_API_URL / KV_REST_API_TOKEN, pero la
 * integración de Upstash del Marketplace de Vercel inyecta
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Si el proyecto se
 * conecta por esa vía, el cliente por defecto no encuentra nada y cada
 * operación falla en silencio.
 *
 * Acá aceptamos los dos nombres y exponemos KV_ACTIVE para poder
 * diagnosticar el estado sin tener que adivinar.
 */
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export const KV_ACTIVE = !!(url && token)

export const kv = KV_ACTIVE ? createClient({ url: url!, token: token! }) : null

/** Qué juego de variables está en uso. Para diagnóstico, no expone valores. */
export function kvSource(): 'KV_REST_API_*' | 'UPSTASH_REDIS_REST_*' | 'sin configurar' {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return 'KV_REST_API_*'
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) return 'UPSTASH_REDIS_REST_*'
  return 'sin configurar'
}
