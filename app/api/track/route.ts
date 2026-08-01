import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CLERK_ACTIVE } from '@/lib/env'
import { registrar, ACCIONES, type Accion } from '@/lib/analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Registra una acción sobre el contenido.
 *
 * Es deliberadamente permisivo: cualquiera puede llamarlo, porque el
 * contenido es público y lo que medimos son visitas. Lo único que se
 * valida es que la acción sea una de las conocidas, para que nadie pueda
 * inflar la base creando claves arbitrarias.
 *
 * El usuario no se toma del cuerpo del pedido sino de la sesión: así nadie
 * puede atribuir actividad a otra persona.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const accion = String(body?.accion ?? '') as Accion
    const slug = String(body?.slug ?? '').slice(0, 120)

    if (!ACCIONES.includes(accion) || !slug) {
      return NextResponse.json({ error: 'parametros-invalidos' }, { status: 400 })
    }

    let userId: string | null = null
    if (CLERK_ACTIVE) {
      try {
        userId = (await auth()).userId
      } catch {
        userId = null
      }
    }

    await registrar(accion, slug, userId)
    return NextResponse.json({ ok: true })
  } catch {
    // Nunca hacemos fallar al cliente por un problema de analítica.
    return NextResponse.json({ ok: false })
  }
}
