import type { Metadata } from 'next'
import { brand } from '@/lib/config/brand'
import { cargarEpisodios, categorias } from '@/lib/episodios'
import { ArchivoClient } from './ArchivoClient'

export const metadata: Metadata = { title: `El Archivo · ${brand.name}` }

/**
 * Se renderiza a pedido y no en el build porque los episodios pueden traer
 * ediciones hechas desde el panel, que viven en Redis. Con la pagina
 * congelada en el build, editar un episodio no se veria hasta el siguiente
 * deploy.
 */
export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const [episodios, cats] = await Promise.all([cargarEpisodios(), categorias()])
  // "Todos" lo pone la página, no los datos: es el filtro que apaga a las
  // demás, no una categoría, y mezclado con ellas obligaba a acordarse de no
  // borrarlo al editar la lista.
  return <ArchivoClient episodios={episodios as any} categorias={['Todos', ...cats]} />
}
