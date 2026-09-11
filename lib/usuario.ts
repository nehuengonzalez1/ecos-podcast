import { currentUser } from '@clerk/nextjs/server'
import { CLERK_ACTIVE } from '@/lib/env'

/**
 * Con que nombre firma la persona que esta con sesion iniciada.
 *
 * Lo usan dos lugares que tienen que coincidir: la pagina del episodio, para
 * no pedir un nombre que ya sabemos, y la API del muro, para firmar el
 * mensaje con ese mismo nombre en vez de creerle al navegador. Si cada uno lo
 * resolviera por su cuenta, el formulario podria anunciar un nombre y
 * guardarse otro.
 *
 * Devuelve null cuando no hay sesion, cuando Clerk no esta configurado, o
 * cuando la cuenta no tiene ningun nombre cargado. En los tres casos el muro
 * hace lo mismo: pedir el nombre a mano.
 *
 * Es de servidor.
 */
export async function nombreDeUsuarioActual(): Promise<string | null> {
  if (!CLERK_ACTIVE) return null

  try {
    const user = await currentUser()
    if (!user) return null

    // fullName ya combina nombre y apellido; si la cuenta se creo sin
    // nombre (pasa con los registros por email), queda el usuario.
    const nombre = user.fullName ?? user.username ?? user.firstName
    return nombre?.trim() || null
  } catch {
    // Un problema con Clerk no tiene por que romper la pagina del episodio:
    // sin nombre, el muro simplemente lo pide.
    return null
  }
}
