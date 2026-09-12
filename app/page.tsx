import { cargarEpisodios } from '@/lib/episodios'
import { HomeClient } from './HomeClient'

/**
 * Se renderiza a pedido y no en el build porque los episodios pueden traer
 * ediciones hechas desde el panel, que viven en Redis. Con la portada
 * congelada en el build, editar un episodio no se veria hasta el siguiente
 * deploy.
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const episodios = await cargarEpisodios()
  return <HomeClient episodios={episodios as any} />
}
