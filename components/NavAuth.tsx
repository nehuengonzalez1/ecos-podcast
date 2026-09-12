'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { User, SlidersHorizontal } from 'lucide-react'

export function NavAuth() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <Link href="/sign-in" className="btn-ghost">
          <User size={14} /> Ingresar
        </Link>
      </SignedOut>
      <SignedIn>
        <EnlacePanel />
        <Link href="/cuenta" className="btn-ghost">Mi cuenta</Link>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  )
}

/**
 * El acceso al panel, solo para quien administra.
 *
 * Antes el unico camino era iniciar sesion, entrar a "Mi cuenta" y encontrar
 * un boton al final: nadie lo adivina.
 *
 * Si la condicion de admin se resolviera en el servidor habria que
 * consultarla en el layout, y eso volveria dinamicas todas las paginas del
 * sitio -- incluidas las que hoy son estaticas -- solo para decidir si
 * mostrar un enlace. Se consulta desde el navegador contra /api/user/status,
 * que ya devuelve `admin` y ya se usa en otros dos lugares. El pedido sale
 * unicamente cuando hay sesion iniciada, porque este componente vive dentro
 * de <SignedIn>.
 *
 * Mientras la respuesta no llega no se muestra nada. Es lo correcto: aparecer
 * y desaparecer seria peor que aparecer un instante despues, y quien no es
 * admin no tiene que ver ni un parpadeo de algo que no le corresponde.
 */
function EnlacePanel() {
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    let vigente = true
    fetch('/api/user/status')
      .then((r) => r.json())
      .then((d) => {
        if (vigente) setEsAdmin(d?.admin === true)
      })
      .catch(() => {
        /* si falla, simplemente no se muestra el enlace */
      })
    return () => {
      vigente = false
    }
  }, [])

  if (!esAdmin) return null

  return (
    <Link href="/admin" className="btn-ghost border-gold/40 text-gold">
      <SlidersHorizontal size={13} /> Panel
    </Link>
  )
}
