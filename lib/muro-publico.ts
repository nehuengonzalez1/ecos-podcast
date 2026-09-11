/**
 * La parte del muro que también corre en el navegador.
 *
 * Vive separada de `lib/muro.ts` a propósito: ese módulo importa el cliente
 * de Redis, y un componente 'use client' que lo importara se llevaría
 * ioredis entero al bundle. Acá no hay nada más que tipos y constantes, así
 * que el formulario y las rutas comparten las mismas reglas sin arrastrar
 * infraestructura al navegador.
 */

export const TIPOS = ['apoyo', 'gracias', 'similar', 'mensaje'] as const
export type TipoMensaje = (typeof TIPOS)[number]

/** Cómo se presenta cada tipo en el formulario y en la tarjeta publicada. */
export const ETIQUETAS: Record<TipoMensaje, string> = {
  apoyo: 'Fuerza',
  gracias: 'Gracias por contarlo',
  similar: 'Me pasó algo parecido',
  mensaje: 'Un mensaje',
}

export const LIMITES = { nombre: 60, ciudad: 60, mensaje: 500, email: 200 } as const

/** Con qué firma un mensaje que pidió no mostrar su nombre. */
export const FIRMA_ANONIMA = 'Anónimo'

/** Menos que esto no es un mensaje, es un golpe de teclado. */
export const MINIMO_MENSAJE = 4

export type Mensaje = {
  id: string
  slug: string
  nombre: string
  mensaje: string
  tipo: TipoMensaje
  ciudad?: string
  /**
   * Privado. Se le pide a quien escribe sin sesion iniciada, como unica
   * forma de saber quien es. Con sesion no se pide: la cuenta ya lo tiene.
   * Nunca se publica: `aPublico()` lo saca antes de que el mensaje salga de
   * la capa de datos.
   */
  email?: string
  /**
   * La persona pidio que su mensaje aparezca sin su nombre.
   *
   * El nombre igual se guarda: quien modera tiene que poder saber quien
   * escribio. Lo que cambia es lo que se publica, y eso lo resuelve
   * `aPublico()` en un solo lugar, para que ningun camino de lectura pueda
   * olvidarse de aplicarlo.
   */
  anonimo?: boolean
  at: string
  estado: 'pendiente' | 'aprobado'
}

/**
 * Lo que efectivamente viaja al navegador.
 *
 * Sin email y sin estado interno. `anonimo` tampoco viaja: cuando lo está, el
 * `nombre` ya viene reemplazado por la firma anónima, así que el navegador no
 * tiene que saber ni decidir nada.
 */
export type MensajePublico = Omit<Mensaje, 'email' | 'estado' | 'anonimo'> & { apoyos: number }

/** Normaliza lo que escribió una persona sin alterar lo que quiso decir. */
export function limpiar(s: unknown, max: number): string {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}
