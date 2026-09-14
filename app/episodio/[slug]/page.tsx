import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cargarEpisodio, cargarEpisodios } from '@/lib/episodios'
import { brand } from '@/lib/config/brand'
import { EpisodeView } from './EpisodeView'
import { TrackView } from '@/components/TrackView'
import { nombreDeUsuarioActual } from '@/lib/usuario'
import { isAdmin } from '@/lib/admin'

// Rendered on-demand — client PremiumGate + Clerk work in dynamic mode without needing SSG.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ep = await cargarEpisodio(slug)
  if (!ep) return { title: `Episodio · ${brand.name}` }
  return {
    title: `${ep.guest} · Episodio ${ep.number} · ${brand.name}`,
    description: ep.summary ?? ep.quote,
  }
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Una sola lectura para todo: el episodio y los que lo rodean salen del
  // mismo catalogo ya editado, asi la ficha y la barra lateral no pueden
  // mostrar versiones distintas del mismo episodio.
  const episodios = await cargarEpisodios()
  const ep = episodios.find((e) => e.slug === slug)
  if (!ep || ep.status !== 'available') notFound()

  const availableEpisodes = episodios.filter((e) => e.status === 'available')
  const upcomingEpisodes = episodios.filter((e) => e.status === 'coming-soon')

  // Si la persona tiene sesion iniciada, el muro ya sabe como se llama y no
  // se lo vuelve a preguntar. Se resuelve aca, en el servidor, porque la
  // pagina ya es dinamica y asi el dato llega con el primer render.
  //
  // esAdmin viaja por el mismo camino: el muro publica solo, asi que quien
  // administra tiene que poder bajar desde la propia pagina lo que el filtro
  // dejo pasar. Es solo para dibujar el boton -- que el borrado se permita o
  // no lo decide de nuevo el servidor en /api/admin/muro.
  const [nombreUsuario, esAdmin] = await Promise.all([nombreDeUsuarioActual(), isAdmin()])

  return (
    <>
      <TrackView accion="episodio" slug={ep.slug} />
      <EpisodeView
        ep={ep}
        available={availableEpisodes}
        upcoming={upcomingEpisodes}
        nombreUsuario={nombreUsuario}
        esAdmin={esAdmin}
      />
    </>
  )
}
