import type { Metadata } from 'next'
import { Infinity as Infinito } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { sorteos, estadoDe, categoriasDeSorteos } from '@/lib/sorteos'
import { textoRestante } from '@/lib/tiempo'
import { ImagenSorteo } from '@/components/SorteoCard'
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
      <section className="relative overflow-hidden pt-28">
        {/* La foto ocupa la mitad derecha y se funde con el negro hacia la
            izquierda, para que el título se apoye sobre fondo parejo. */}
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <ImagenSorteo src={null} alt="" className="h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-transparent" />
        </div>

        <div className="container-page relative pb-14">
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
