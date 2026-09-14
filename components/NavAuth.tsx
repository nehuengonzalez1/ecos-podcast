'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { User, SlidersHorizontal, CircleUserRound } from 'lucide-react'

/**
 * Si quien mira administra el sitio.
 *
 * Se consulta desde el navegador y no en el servidor: resolverlo en el layout
 * obligaría a consultarlo en cada página y volvería dinámicas todas las del
 * sitio -- incluidas las que hoy son estáticas -- solo para decidir si mostrar
 * un enlace. El pedido sale únicamente con sesión iniciada, porque quien lo
 * usa vive dentro de <SignedIn>.
 *
 * Mientras la respuesta no llega devuelve false: quien no administra no tiene
 * que ver ni un parpadeo de algo que no le corresponde.
 */
function useEsAdmin(): boolean {
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    let vigente = true
    fetch('/api/user/status')
      .then((r) => r.json())
      .then((d) => {
        if (vigente) setEsAdmin(d?.admin === true)
      })
      .catch(() => {
        /* si falla, simplemente no se muestra */
      })
    return () => {
      vigente = false
    }
  }, [])

  return esAdmin
}

/**
 * La esquina de la sesión.
 *
 * En la barra, "Mi cuenta" y "Panel" viven dentro del menú de la foto en vez
 * de ser dos botones sueltos. Eran tres piezas compitiendo por el mismo
 * espacio, y el nombre del sitio terminaba pisando al primer enlace del menú;
 * además hace lugar para lo que todavía falta sumar arriba.
 *
 * En el menú de teléfono, en cambio, van como enlaces a la vista: ahí sobra
 * espacio vertical y esconderlos dentro de otro desplegable sería un paso de
 * más para llegar al mismo lado.
 */
export function NavAuth({ variante = 'barra' }: { variante?: 'barra' | 'movil' }) {
  const esAdmin = useEsAdmin()

  if (variante === 'movil') {
    return (
      <div className="flex flex-col gap-4">
        <SignedOut>
          <Link href="/sign-in" className="btn-ghost self-start">
            <User size={14} /> Ingresar
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/cuenta"
            className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-cream-200/80"
          >
            <CircleUserRound size={15} /> Mi cuenta
          </Link>
          {esAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-gold"
            >
              <SlidersHorizontal size={15} /> Panel
            </Link>
          )}
          <div className="pt-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <Link href="/sign-in" className="btn-ghost">
          <User size={14} /> Ingresar
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/">
          <UserButton.MenuItems>
            <UserButton.Link
              label="Mi cuenta"
              labelIcon={<CircleUserRound size={15} />}
              href="/cuenta"
            />
            {/* El panel solo existe para quien administra.
                Sin permisos se pasa `false` y no un fragmento vacío: Clerk
                recorre los hijos y avisa por consola de cualquiera que no sea
                uno de sus items, pero saltea los falsy sin chistar. Un <></>
                llenaría la consola de errores a quien no es admin. */}
            {esAdmin && (
              <UserButton.Link
                label="Panel"
                labelIcon={<SlidersHorizontal size={15} />}
                href="/admin"
              />
            )}
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
    </div>
  )
}
