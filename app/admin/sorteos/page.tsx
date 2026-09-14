import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { brand } from '@/lib/config/brand'
import { sorteos, estadoDe } from '@/lib/sorteos'
import { contarParticipantes, SORTEOS_ACTIVOS } from '@/lib/participaciones'
import { NavPanel } from '../NavPanel'
import { SorteosPanel, type FilaSorteo } from '../SorteosPanel'

export const metadata = { title: `Sorteos · ${brand.name}` }
export const dynamic = 'force-dynamic'

/**
 * El panel de sorteos.
 *
 * Acá solo se cuentan los anotados de cada uno. La lista completa se pide al
 * abrir un sorteo: traer los participantes de todos al entrar sería esperar
 * por datos que casi siempre no se miran.
 */
export default async function SorteosAdminPage() {
  if (!(await isAdmin())) redirect('/')

  const lista = sorteos()
  const conteos = await Promise.all(lista.map((s) => contarParticipantes(s.slug)))

  const filas: FilaSorteo[] = lista.map((s, i) => ({
    slug: s.slug,
    titulo: s.titulo,
    categoria: s.categoria,
    estado: estadoDe(s),
    cierra: s.cierra,
    anotados: conteos[i],
  }))

  const totalAnotados = conteos.reduce((a, b) => a + b, 0)

  return (
    <section className="pt-32 pb-24 min-h-[80vh]">
      <div className="container-page">
        <p className="eyebrow mb-4">Admin</p>
        <h1 className="title-display text-5xl">Sorteos</h1>

        <NavPanel />

        <p className="mt-6 max-w-2xl text-sm text-cream-200/70">
          Abrí un sorteo para ver quiénes se anotaron y sortear cuando cierre el plazo. Hay{' '}
          <span className="text-gold">{totalAnotados}</span>{' '}
          {totalAnotados === 1 ? 'participación' : 'participaciones'} en total.
        </p>

        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-cream-400/70">
          El ganador se elige al azar del lado del servidor, sobre la lista completa. Cada tirada
          queda registrada con su fecha: si se sortea de nuevo, el panel lo muestra.
        </p>

        <div className="mt-8">
          <SorteosPanel filas={filas} activo={SORTEOS_ACTIVOS} />
        </div>
      </div>
    </section>
  )
}
