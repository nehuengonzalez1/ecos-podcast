import { currentUser } from '@clerk/nextjs/server'
import { CLERK_ACTIVE } from '@/lib/env'

/**
 * Quien puede entrar al panel.
 *
 * Se identifica por email y no por el id de usuario de Clerk a proposito. El
 * id cambia si algun dia se migra de instancia de Clerk, y eso dejaria al
 * dueno del sitio afuera de su propio panel sin forma de volver a entrar.
 * El email sobrevive esa migracion.
 *
 * Falla cerrado en todos los casos dudosos: sin Clerk, sin sesion, sin lista
 * de admins o con el email sin confirmar, la respuesta es que no.
 */
export async function isAdmin(): Promise<boolean> {
  if (!CLERK_ACTIVE) return false

  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  // Sin lista configurada no hay administradores. Antes esto se evaluaba
  // igual y daba false, pero asi se evita ademas la consulta a Clerk.
  if (admins.length === 0) return false

  const user = await currentUser()
  if (!user) return false

  const principal = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
  if (!principal) return false

  // Un email sin confirmar no prueba nada: al registrarse, cualquiera puede
  // escribir la direccion de otra persona. Sin este chequeo alcanzaria con
  // crear una cuenta declarando el mail del admin para entrar al panel.
  if (principal.verification?.status !== 'verified') {
    // Se registra el motivo, sin la direccion, para poder diagnosticar un
    // rechazo inesperado desde los logs sin dejar datos personales ahi.
    console.warn('[admin] acceso denegado: el email principal no esta verificado')
    return false
  }

  return admins.includes(principal.emailAddress.toLowerCase())
}
