import type { Metadata } from 'next'
import Link from 'next/link'
import { CreditCard, Eye, Infinity as Infinito, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { brand } from '@/lib/config/brand'
import {
  cargarProductos,
  precioTexto,
  cuotaTexto,
  CUOTAS,
  RUBROS,
  TIENDA_PUBLICA,
} from '@/lib/tienda'
import { TiendaCliente, type ProductoVista } from './TiendaCliente'

export const metadata: Metadata = {
  title: `Tienda · ${brand.name}`,
  description: 'La tienda de LQLVE.',
}

export const dynamic = 'force-dynamic'

const GARANTIAS = [
  { icono: Truck, titulo: 'Envíos a todo el país', detalle: 'Con Andreani y Correo Argentino' },
  { icono: CreditCard, titulo: `${CUOTAS} cuotas sin interés`, detalle: 'Con todas las tarjetas' },
  { icono: ShieldCheck, titulo: 'Compra segura', detalle: 'Tus datos protegidos' },
  { icono: PackageCheck, titulo: 'Cambios y devoluciones', detalle: 'Sin complicaciones' },
]

export default async function TiendaPage() {
  const admin = await isAdmin()
  const abierta = TIENDA_PUBLICA || admin

  /**
   * La decisión se toma en el servidor y el catálogo ni siquiera se carga
   * cuando no corresponde: si la página se armara entera y se escondiera del
   * lado del navegador, los productos y sus precios viajarían igual en el HTML
   * y se leerían mirando el código fuente.
   */
  if (!abierta) return <Proximamente />

  const productos = await cargarProductos()

  const lista: ProductoVista[] = productos.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria,
    resumen: p.resumen,
    precio: p.precio,
    precioTexto: precioTexto(p.precio),
    cuotaTexto: cuotaTexto(p.precio),
    imagen: p.imagen,
    talles: p.variantes?.opciones ?? [],
    colores: p.colores ?? [],
    agotado: p.estado === 'agotado',
  }))

  // Los talles y colores del filtro salen de lo que hay: ofrecer un talle que
  // ningún producto tiene solo lleva a una lista vacía.
  const talles = [...new Set(lista.flatMap((p) => p.talles))]
  const colores = [...new Set(lista.flatMap((p) => p.colores))]
  // El tope del deslizador se redondea a la miltena de arriba, para que el
  // producto más caro no quede justo en el borde.
  const precioMaximo = Math.max(1000, Math.ceil(Math.max(...lista.map((p) => p.precio), 0) / 1000) * 1000)

  return (
    <>
      <section className="relative overflow-hidden pt-20">
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/tienda/cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/85 to-ink-900/30" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>

        {/* Mas alto que antes: la foto es panoramica y en una franja baja se
            perdian el foco y la parte de arriba de los productos. */}
        <div className="container-page relative flex min-h-[26rem] flex-col justify-center pb-12 pt-6">
          {!TIENDA_PUBLICA && (
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-sm border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-cream-200/90">
              <Eye size={14} className="text-gold" />
              Esto lo ves solo vos. Para el resto, la tienda dice «próximamente».
            </div>
          )}

          <p className="eyebrow mb-3">Tienda {brand.name}</p>
          <h1 className="title-display text-5xl leading-[0.95] md:text-6xl">
            OBJETOS
            <br />
            QUE CONECTAN
          </h1>
          <p className="mt-5 max-w-sm text-[11px] uppercase leading-relaxed tracking-[0.22em] text-cream-200/70">
            Ideas, conversaciones, experiencias.
            <br />
            {brand.fullName}, también se lleva.
          </p>
        </div>
      </section>

      <TiendaCliente
        productos={lista}
        rubros={[...RUBROS]}
        talles={talles}
        colores={colores}
        precioMaximo={precioMaximo}
      />

      <section className="border-t border-cream-400/10 bg-ink-800/40 py-10">
        <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {GARANTIAS.map(({ icono: Icono, titulo, detalle }) => (
            <div key={titulo} className="flex items-center gap-3.5">
              <Icono size={26} strokeWidth={1.1} className="shrink-0 text-cream-200/70" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cream-50">
                  {titulo}
                </p>
                <p className="mt-0.5 text-[11px] text-cream-400/70">{detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/** Lo que ve quien entra mientras la tienda no esté abierta. */
function Proximamente() {
  return (
    <section className="flex min-h-[70vh] items-center pt-28 pb-24">
      <div className="container-page text-center">
        <p className="eyebrow mb-4">Tienda {brand.name}</p>
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
