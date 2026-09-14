import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye, Infinity as Infinito } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { brand } from '@/lib/config/brand'
import { cargarProductos, categoriasDeTienda, precioTexto, TIENDA_PUBLICA } from '@/lib/tienda'
import { TiendaGrid } from './TiendaGrid'

export const metadata: Metadata = {
  title: `Tienda · ${brand.name}`,
  description: 'La tienda de LQLVE.',
}

/**
 * Se rinde a pedido porque lo que muestra depende de quién mira: el catálogo
 * a quien administra y el aviso de «próximamente» al resto. Congelada en el
 * build serviría la misma copia a todos.
 */
export const dynamic = 'force-dynamic'

export default async function TiendaPage() {
  const admin = await isAdmin()
  const abierta = TIENDA_PUBLICA || admin

  /**
   * La decisión se toma en el servidor y el catálogo ni siquiera se carga
   * cuando no corresponde.
   *
   * Es a propósito: si la página se armara entera y se escondiera con CSS o
   * con una condición del lado del navegador, los productos y sus precios
   * viajarían igual en el HTML y cualquiera podría leerlos mirando el código
   * fuente. Esconder no es lo mismo que no mandar.
   */
  if (!abierta) return <Proximamente />

  const [todos, cats] = await Promise.all([cargarProductos(), categoriasDeTienda()])
  const lista = todos.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria,
    resumen: p.resumen,
    imagen: p.imagen,
    precio: precioTexto(p.precio),
    agotado: p.estado === 'agotado',
  }))

  return (
    <section className="pt-28 pb-24">
      <div className="container-page">
        {/* Mientras la tienda no esté abierta, quien administra tiene que
            saber que lo que ve no lo ve nadie más. Sin este aviso es muy
            fácil creer que ya está publicada. */}
        {!TIENDA_PUBLICA && (
          <div className="mb-8 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-cream-200/90">
            <Eye size={14} className="text-gold" />
            Esto lo ves solo vos. Para el resto, la tienda todavía dice «próximamente».
          </div>
        )}

        <p className="eyebrow mb-4">Lo que se lleva puesto</p>
        <h1 className="title-display text-6xl leading-none md:text-7xl">TIENDA</h1>
        <p className="subtitle-signature mt-5 text-3xl md:text-4xl">
          Las historias también se usan.
        </p>
        <p className="body-copy mt-5 max-w-md text-sm leading-relaxed text-cream-200/75">
          Objetos de {brand.name} para llevarse a casa. Cada uno es el mismo que usamos en el
          estudio.
        </p>

        <div className="mt-12">
          <TiendaGrid productos={lista} categorias={cats} />
        </div>
      </div>
    </section>
  )
}

/** Lo que ve quien entra mientras la tienda no esté abierta. */
function Proximamente() {
  return (
    <section className="flex min-h-[70vh] items-center pt-28 pb-24">
      <div className="container-page text-center">
        <p className="eyebrow mb-4">Lo que se lleva puesto</p>
        <h1 className="title-display text-6xl leading-none md:text-7xl">TIENDA</h1>
        <p className="subtitle-signature mt-5 text-3xl md:text-4xl">Muy pronto.</p>

        <div className="divider-line" />

        <p className="body-copy mx-auto mt-6 max-w-md text-base leading-relaxed text-cream-200/75">
          Estamos preparando los objetos de {brand.name} para que puedas llevártelos a casa.
          Todavía no, pero falta poco.
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
