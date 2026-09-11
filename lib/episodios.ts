import data from '@/data/episodes.json'
import type { EpisodioRef } from '@/lib/mailer'

/**
 * Acceso a los episodios del catálogo.
 *
 * El muro escribe claves en Redis derivadas del slug, así que el slug que
 * llega por la API nunca se usa crudo: primero tiene que corresponder a un
 * episodio publicado. Sin eso, cualquiera podría llenar la base de claves
 * inventadas mandando slugs al azar.
 */

const episodios = data.episodes as any[]

export function buscarEpisodio(slug: string): any | null {
  return episodios.find((e) => e.slug === slug) ?? null
}

export function esEpisodioPublicado(slug: string): boolean {
  const ep = buscarEpisodio(slug)
  return !!ep && ep.status === 'available'
}

/** Lo que necesita el aviso de moderación para identificar el episodio. */
export function refDeEpisodio(ep: any): EpisodioRef {
  return {
    slug: ep.slug,
    guest: ep.guest,
    number: String(ep.number),
  }
}
