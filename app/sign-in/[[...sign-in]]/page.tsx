import { SignIn } from '@clerk/nextjs'
import { brand } from '@/lib/config/brand'
import { CLERK_ACTIVE } from '@/lib/env'

export const metadata = { title: `Ingresar · ${brand.name}` }

export default function SignInPage() {
  return (
    <section className="spotlight-bg min-h-[100vh] pt-28 pb-16 flex items-center">
      <div className="container-page flex flex-col items-center">
        <h1 className="title-display mb-8 text-4xl">Bienvenidx de vuelta</h1>
        {CLERK_ACTIVE ? (
          <SignIn signUpUrl="/sign-up" />
        ) : (
          <div className="max-w-sm rounded-sm border border-cream-400/15 bg-ink-800/60 p-8 text-center">
            <p className="eyebrow mb-3">Ingreso · próximamente</p>
            <p className="text-sm text-cream-200/70">
              El login todavía no está activo en este entorno. Configurá las credenciales de Clerk para habilitarlo.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
