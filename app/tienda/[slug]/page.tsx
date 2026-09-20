import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronRight, Eye, Infinity as Infinito } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { brand } from '@/lib/config/brand'
import { buscarProducto, precioTexto, cuotaTexto, CUOTAS, TIENDA_PUBLICA } from '@/lib/tienda'
import { Comprar } from './Comprar'
import { ImagenProducto } from '@/components/ProductoCard'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  // El título tampoco cuenta lo que hay adentro mientras la tienda esté
  // cerrada: es lo que se ve en la pestaña y en lo que comparte un buscador.
  if (!(TIENDA_PUBLICA || (await isAdmin()))) return { title: `Tienda · ${brand.name}` }

  const { slug } = await params
  const p = await buscarProducto(slug)
  if (!p) return { title: `Tienda · ${brand.name}` }
  return { title: `${p.nombre} · Tienda · ${brand.name}`, description: p.resumen }
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  /**
   * La ficha vuelve a preguntar, no alcanza con que el listado lo haya hecho.
   *
   * Quien tenga la dirección de un producto puede entrar directamente sin
   * pasar por el listado, y entonces el candado del listado no habría corrido
   * nunca. Cada página que muestra algo privado tiene que preguntarlo por su
   * cuenta.
   */
  if (!(TIENDA_PUBLICA || (await isAdmin()))) notFound()

  const { slug } = await params
  const p = await buscarProducto(slug)
  if (!p) notFound()

  const agotado = p.estado === 'agotado'

  return (
    <section className="pt-28 pb-20">
      <div className="container-page">
        {!TIENDA_PUBLICA && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-cream-200/90">
            <Eye size={14} className="text-gold" />
            Esto lo ves solo vos.
          </div>
        )}

        <nav className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cream-400/70">
          <Link href="/tienda" className="transition hover:text-gold">
            Tienda
          </Link>
          <ChevronRight size={12} />
          <span className="text-cream-200/80">{p.nombre}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ImagenProducto
            src={p.imagen}
            alt={p.nombre}
            className="aspect-square rounded-sm border border-cream-400/10"
            apagada={agotado}
          />

          <div>
            <p className="eyebrow">{p.categoria}</p>
            <h1 className="title-display mt-2 text-4xl leading-none md:text-5xl">{p.nombre}</h1>

            <p className="mt-5 text-3xl text-cream-50">{precioTexto(p.precio)}</p>
            <p className="mt-1 text-sm text-cream-400/75">
              {CUOTAS} cuotas sin interes de {cuotaTexto(p.precio)}
            </p>

            <div className="mt-6 space-y-3">
              {p.descripcion.map((t, i) => (
                <p key={i} className="body-copy text-sm leading-relaxed text-cream-200/80">
                  {t}
                </p>
              ))}
            </div>


            {!!p.detalles.length && (
              <ul className="mt-8 space-y-2">
                {p.detalles.map((d, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-sm leading-relaxed text-cream-200/70"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/70"
                    />
                    {d}
                  </li>
                ))}
              </ul>
            )}

            <Comprar
              slug={p.slug}
              nombre={p.nombre}
              precio={p.precio}
              imagen={p.imagen}
              variantes={p.variantes}
              colores={p.colores ?? []}
              agotado={agotado}
            />

            <p className="mt-3 text-[11px] text-cream-400/60">
              Lo que agregues se guarda. Falta conectar el cobro para poder comprar.
            </p>

            <div className="mt-12 flex flex-col items-start gap-1.5 text-cream-400/35">
              <Infinito size={22} strokeWidth={1.25} />
              <p className="text-[9px] uppercase tracking-[0.3em]">{brand.fullName}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
