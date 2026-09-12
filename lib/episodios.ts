import data from '@/data/episodes.json'
import type { EpisodioRef } from '@/lib/mailer'
import { aplicar, overrideDe, todosLosOverrides } from '@/lib/contenido'

/**
 * Acceso a los episodios.
 *
 * Hay dos lecturas y no son intercambiables:
 *
 *  - Las `async` (cargarEpisodios, cargarEpisodio) devuelven el episodio con
 *    las ediciones del panel ya superpuestas. Es lo que tiene que usar todo
 *    lo que se muestra, para que una edicion se vea en el sitio entero y no
 *    solo en la pagina donde se guardo.
 *  - Las sincronicas (buscarEpisodio, esEpisodioPublicado) leen el archivo
 *    crudo. Sirven para validar que un slug exista, que es lo unico que
 *    necesitan las APIs y lo unico que las ediciones no pueden cambiar,
 *    porque el slug no es editable.
 *
 * El muro escribe claves en Redis derivadas del slug, asi que el slug que
 * llega por la API nunca se usa crudo: primero tiene que corresponder a un
 * episodio del catalogo. Sin eso, cualquiera podria llenar la base de claves
 * inventadas mandando slugs al azar.
 */

const episodios = data.episodes as any[]

/** El catalogo tal cual esta en el archivo, sin ediciones. */
export function episodiosDelArchivo(): any[] {
  return episodios
}

export function buscarEpisodio(slug: string): any | null {
  return episodios.find((e) => e.slug === slug) ?? null
}

export function esEpisodioPublicado(slug: string): boolean {
  const ep = buscarEpisodio(slug)
  return !!ep && ep.status === 'available'
}

/** Las categorias del catalogo, para los filtros del archivo. */
export function categorias(): string[] {
  return (data.categories as string[]) ?? []
}

/** Todos los episodios, con las ediciones del panel aplicadas. */
export async function cargarEpisodios(): Promise<any[]> {
  const overrides = await todosLosOverrides()
  if (Object.keys(overrides).length === 0) return episodios
  return episodios.map((e) => aplicar(e, overrides[e.slug] ?? {}))
}

/** Un episodio, con sus ediciones aplicadas. */
export async function cargarEpisodio(slug: string): Promise<any | null> {
  const base = buscarEpisodio(slug)
  if (!base) return null
  return aplicar(base, await overrideDe(slug))
}

/** Lo que necesita el aviso de moderación para identificar el episodio. */
export function refDeEpisodio(ep: any): EpisodioRef {
  return {
    slug: ep.slug,
    guest: ep.guest,
    number: String(ep.number),
  }
}
