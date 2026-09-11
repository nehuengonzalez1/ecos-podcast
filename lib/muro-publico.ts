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

export const LIMITES = { nombre: 60, ciudad: 60, mensaje: 900 } as const

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
   * Historico: el muro ya no pide email. El campo sigue declarado porque en
   * Redis todavia hay mensajes guardados cuando si se pedia, y `aPublico()`
   * tiene que poder seguir sacandolo. Quitarlo del tipo no lo quitaria de los
   * datos: lo dejaria pasar al muro publico sin que nadie lo note.
   */
  email?: string
  at: string
  estado: 'pendiente' | 'aprobado'
}

/** Lo que efectivamente viaja al navegador: sin email y sin estado interno. */
export type MensajePublico = Omit<Mensaje, 'email' | 'estado'> & { apoyos: number }

/** Normaliza lo que escribió una persona sin alterar lo que quiso decir. */
export function limpiar(s: unknown, max: number): string {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}
