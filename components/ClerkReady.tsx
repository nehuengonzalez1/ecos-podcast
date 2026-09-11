'use client'

import { createContext, useContext } from 'react'

/**
 * Si Clerk está realmente montado, para los componentes de cliente.
 *
 * Existe porque la decisión no se puede recalcular en el navegador. Clerk
 * está activo solo si están la clave pública *y* la secreta, y la secreta
 * nunca llega al cliente: cualquier flag que el navegador arme por su cuenta
 * mira nada más que la mitad del problema.
 *
 * Antes cada componente de cliente decidía solo, mirando únicamente la clave
 * pública. Con la pública cargada y la secreta ausente, el layout no montaba
 * <ClerkProvider> pero el Nav sí renderizaba <SignedOut> y PremiumGate
 * llamaba a useAuth(): componentes de Clerk sin su provider, que revientan
 * la página entera. Un `vercel env pull` que trae solo las variables
 * públicas alcanza para provocarlo.
 *
 * Ahora la decisión se toma una sola vez en el layout, que es servidor y ve
 * las dos claves, y baja por contexto. El provider y sus consumidores no
 * pueden quedar en desacuerdo.
 *
 * El default es `false` a propósito: si alguien renderiza uno de estos
 * componentes fuera del provider, se degrada al estado "próximamente" en vez
 * de romper.
 */
const ClerkReadyContext = createContext(false)

export function ClerkReadyProvider({
  ready,
  children,
}: {
  ready: boolean
  children: React.ReactNode
}) {
  return <ClerkReadyContext.Provider value={ready}>{children}</ClerkReadyContext.Provider>
}

export function useClerkReady(): boolean {
  return useContext(ClerkReadyContext)
}
