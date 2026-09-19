/**
 * Runtime flags for features whose env is user-supplied post-deploy.
 * All routes/components should render harmlessly when these are false.
 */

/**
 * Clerk está activo solo con las dos claves. Es SOLO DE SERVIDOR: en el
 * navegador `CLERK_SECRET_KEY` no existe y esto daría `false` siempre.
 *
 * Los componentes de cliente no deben recalcular esto por su cuenta —
 * mirando solo la clave pública daban `true` con Clerk apagado y rompían la
 * página al usar componentes sin <ClerkProvider>. Tienen que leerlo con
 * `useClerkReady()`, que recibe esta misma decisión desde el layout.
 */
export const CLERK_ACTIVE =
  !!process.env.CLERK_SECRET_KEY &&
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_ZmFrZS')

export const MP_ACTIVE = !!process.env.MP_ACCESS_TOKEN

/**
 * La suscripcion se muestra cerrada hasta que este lista para cobrar, igual
 * que la tienda con TIENDA_PUBLICA. Mientras esta en false, el precio se
 * reemplaza por un guion y el boton dice "proximamente" y no hace nada;
 * quien administra la sigue viendo entera.
 *
 * Se abre poniendo SUSCRIPCION_PUBLICA=1 en Vercel, sin tocar codigo ni
 * volver a desplegar.
 */
export const SUSCRIPCION_PUBLICA = process.env.SUSCRIPCION_PUBLICA === '1'

/**
 * Los sorteos, igual: cerrados hasta que haya alguno para publicar de
 * verdad. Quien administra los sigue viendo y puede cargarlos desde el
 * panel; el resto ve una pantalla de "muy pronto".
 *
 * Se abren poniendo SORTEOS_PUBLICOS=1 en Vercel.
 */
export const SORTEOS_PUBLICOS = process.env.SORTEOS_PUBLICOS === '1'
