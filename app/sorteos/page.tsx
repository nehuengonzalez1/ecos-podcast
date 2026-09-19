import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye, Infinity as Infinito } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { isAdmin } from '@/lib/admin'
import { SORTEOS_PUBLICOS } from '@/lib/env'
import { cargarSorteos, estadoDe, categoriasDeSorteos } from '@/lib/sorteos'
import { textoRestante } from '@/lib/tiempo'
import { SorteosLista } from './SorteosLista'

export const metadata: Metadata = {
  title: `Sorteos · ${brand.name}`,
  description: 'Sorteos de LQLVE: desde objetos hasta experiencias únicas.',
}

/**
 * El estado y el tiempo que falta dependen de la hora, así que la página no
 * puede quedar congelada en el build: un sorteo cerrado seguiría figurando
 * como activo hasta el siguiente deploy.
 */
export const dynamic = 'force-dynamic'

export default async function SorteosPage() {
  /**
   * La decision se toma en el servidor y los sorteos ni se cargan cuando no
   * corresponde: si la pagina se armara entera y se escondiera del lado del
   * navegador, los premios y las fechas viajarian igual en el HTML.
   */
  if (!(SORTEOS_PUBLICOS || (await isAdmin()))) return <Proximamente />

  const [todos, cats] = await Promise.all([cargarSorteos(), categoriasDeSorteos()])
  const lista = todos.map((s) => ({
    slug: s.slug,
    titulo: s.titulo,
    categoria: s.categoria,
    resumen: s.resumen,
    imagen: s.imagen,
    cierra: s.cierra,
    estado: estadoDe(s),
    tiempoInicial: textoRestante(s.cierra, 'corto'),
  }))

  return (
    <>
      <section className="relative min-h-[30rem] overflow-hidden pt-28 lg:min-h-[34rem]">
        {/* La foto va a todo el ancho. El lado izquierdo de la toma ya es casi
            negro, así que el título se apoya ahí sin tapar la caja; el
            degradado refuerza esa zona para que el texto siga legible sin
            depender de cómo recorte la imagen en cada pantalla.

            En pantallas angostas se encuadra más a la derecha, que es donde
            está la caja: centrada, el recorte se comería justo el motivo. */}
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/sorteos/cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-[68%_center] lg:object-center"
          />
          {/* En ancho completo el texto ocupa solo la franja izquierda y la
              foto respira a la derecha. En pantallas angostas el texto cruza
              toda la imagen, así que ahí el velo es mucho más cerrado: con el
              degradado suave, el título se apoyaba justo sobre el logo de la
              caja y las dos cosas se estorbaban. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/90 to-ink-900/70 lg:via-ink-900/80 lg:to-ink-900/25" />
          {/* Cierra contra el negro de la página, arriba con el menú y abajo
              con el listado, para que la foto no termine en un corte seco. */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>

        <div className="container-page relative flex min-h-[22rem] flex-col justify-center pb-14 lg:min-h-[26rem]">
          <div className="max-w-xl">
            {!SORTEOS_PUBLICOS && (
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-sm border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-cream-200/90">
                <Eye size={14} className="text-gold" />
                Esto lo ves solo vos. Para el resto, los sorteos dicen «próximamente».
              </div>
            )}

            <p className="eyebrow mb-4">Más que objetos, experiencias</p>
            <h1 className="title-display text-6xl leading-none md:text-8xl">SORTEOS</h1>
            <p className="subtitle-signature mt-5 text-3xl md:text-4xl">
              Historias que también se viven fuera de la pantalla.
            </p>
            <p className="body-copy mt-5 max-w-md text-sm leading-relaxed text-cream-200/75">
              Acá vas a encontrar todos los sorteos activos, desde objetos hasta experiencias
              únicas. Formá parte, porque {brand.name} también se comparte.
            </p>
          </div>
        </div>
      </section>

      <SorteosLista sorteos={lista} categorias={cats} />

      <div className="pb-16">
        <div className="container-page flex flex-col items-center gap-2 text-cream-400/40">
          <Infinito size={26} strokeWidth={1.25} />
          <p className="text-[9px] uppercase tracking-[0.35em]">{brand.fullName}</p>
        </div>
      </div>
    </>
  )
}

/** Lo que ve cualquiera mientras SORTEOS_PUBLICOS no este en 1. */
function Proximamente() {
  return (
    <section className="flex min-h-[70vh] items-center pt-28 pb-24">
      <div className="container-page text-center">
        <p className="eyebrow mb-4">Sorteos {brand.name}</p>
        <h1 className="title-display text-6xl leading-none md:text-7xl">SORTEOS</h1>
        <p className="subtitle-signature mt-5 text-3xl md:text-4xl">Muy pronto.</p>

        <div className="divider-line" />

        <p className="body-copy mx-auto mt-6 max-w-md text-base leading-relaxed text-cream-200/75">
          Estamos preparando los primeros sorteos de {brand.name}, desde objetos hasta
          experiencias. Todavía no, pero falta poco.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/comunidad" className="btn-gold">
            Enterate primero
          </Link>
          <Link href="/archivo" className="btn-ghost">
            Ir al archivo
          </Link>
        </div>

        <div className="mt-16 flex flex-col items-center gap-2 text-cream-400/35">
          <Infinito size={26} strokeWidth={1.25} />
          <p className="text-[9px] uppercase tracking-[0.35em]">{brand.fullName}</p>
        </div>
      </div>
    </section>
  )
}
