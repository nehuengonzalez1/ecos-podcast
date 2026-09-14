import type { Metadata } from 'next'
import { Infinity as Infinito } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { sorteos, estadoDe, categoriasDeSorteos } from '@/lib/sorteos'
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

export default function SorteosPage() {
  const lista = sorteos().map((s) => ({
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

      <SorteosLista sorteos={lista} categorias={categoriasDeSorteos()} />

      <div className="pb-16">
        <div className="container-page flex flex-col items-center gap-2 text-cream-400/40">
          <Infinito size={26} strokeWidth={1.25} />
          <p className="text-[9px] uppercase tracking-[0.35em]">{brand.fullName}</p>
        </div>
      </div>
    </>
  )
}
