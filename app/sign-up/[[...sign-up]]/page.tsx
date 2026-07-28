import { SignUp } from '@clerk/nextjs'
import { brand } from '@/lib/config/brand'
import { CLERK_ACTIVE } from '@/lib/env'

export const metadata = { title: `Crear cuenta · ${brand.name}` }

export default function SignUpPage() {
  return (
    <section className="spotlight-bg min-h-[100vh] pt-28 pb-16 flex items-center">
      <div className="container-page flex flex-col items-center">
        <h1 className="mb-8 font-serif text-4xl italic text-cream-50">Creá tu cuenta</h1>
        {CLERK_ACTIVE ? (
          <SignUp signInUrl="/sign-in" />
        ) : (
          <div className="max-w-sm rounded-sm border border-cream-400/15 bg-ink-800/60 p-8 text-center">
            <p className="eyebrow mb-3">Registro · próximamente</p>
            <p className="text-sm text-cream-200/70">
              La creación de cuentas todavía no está activa en este entorno. Configurá las credenciales de Clerk para habilitarla.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
