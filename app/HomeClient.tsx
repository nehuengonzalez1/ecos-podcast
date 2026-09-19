'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Gift,
  Heart,
  Mail,
  ShoppingBag,
  Star,
  Ticket,
  Truck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { type Episode } from '@/components/EpisodeCard'
import { Stamp } from '@/components/Stamp'

/**
 * Las cuatro secciones de la home, armadas desde las referencias.
 *
 * En las referencias el texto venia quemado dentro de la imagen. Aca se
 * separa: de cada una se recorto solo la parte fotografica -- las polaroids,
 * el merchandising, el baul -- y vive en /imagenes/home; el titulo, la
 * bajada, el boton y los iconos son HTML con las tipografias del sitio. Asi
 * el texto escala, se puede seleccionar, lo lee un lector de pantalla y sigue
 * siendo legible en un telefono, donde una franja de 2,2 a 1 con el texto
 * adentro quedaria diminuta.
 *
 * `episodios` sigue llegando aunque ninguna seccion lo use todavia.
 */
export function HomeClient({ episodios: _episodios }: { episodios: Episode[] }) {
  return (
    <>
      {/* ── El archivo ─────────────────────────────────────────────────
          Primera de la pagina, asi que el pt de arriba despeja la barra de
          navegacion, que es fija y mide 80 px. */}
      <section className="relative overflow-hidden pb-20 pt-28 md:pb-24 md:pt-32">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* La foto conserva su proporcion: no lleva object-cover ni alto
                fijo, asi que no se recorta a ningun ancho. El degradado del
                borde interior disimula el corte contra el fondo de la
                pagina, que es de un negro apenas distinto al de la escena. */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/imagenes/home/archivo.webp"
                alt="Una pila de polaroids del estudio apoyada sobre un cuaderno de LQLVE"
                className="w-full"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-ink-900 to-transparent lg:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900 to-transparent"
              />
            </div>

            <div className="relative">
              <p className="eyebrow mb-4">Un lugar</p>
              <h1 className="title-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Donde las{' '}
                <span className="hand-underline italic">historias</span>
                <br />
                se quedan.
              </h1>
              <p className="body-copy mt-6 max-w-md text-base leading-relaxed text-cream-200/80">
                Bienvenida al archivo de {brand.name}. Cada polaroid, cada carta, cada objeto acá es
                real. Y sigue creciendo con vos.
              </p>
              <Link href="/archivo" className="btn-gold mt-8">
                {brand.cta.exploreArchive} <ArrowRight size={16} />
              </Link>
              <Firma className="mt-10" />

              {/* El sello es el componente que ya existe, no un recorte de la
                  referencia: asi gira y respira con el resto del sitio. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 right-0 hidden opacity-70 xl:block"
              >
                <Stamp />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sorteos ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow mb-4">Sorteos</p>
              <h2 className="title-display text-4xl leading-[1.05] sm:text-5xl">
                Ganá con <span className="italic text-gold-light">{brand.name}</span>.
              </h2>
              <p className="body-copy mt-6 max-w-md text-base leading-relaxed text-cream-200/80">
                Participá de nuestros sorteos y llevate productos, experiencias y mucho más. Porque
                ser parte también tiene recompensas.
              </p>
              <Link href="/sorteos" className="btn-gold mt-8">
                <Gift size={16} /> Ver sorteos <ArrowRight size={16} />
              </Link>

              <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden">
                <Ventaja icono={Star} texto="Productos exclusivos" />
                <Ventaja icono={Ticket} texto="Experiencias únicas" separador />
                <Ventaja icono={Users} texto="Para nuestra comunidad" separador />
              </div>
              <Firma className="mt-10" />
            </div>

            {/* La foto va segunda en el codigo y por lo tanto abajo en
                telefono: lo primero que tiene que leerse es de que se trata,
                no el bodegon. */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/imagenes/home/sorteos.webp"
                alt="Caja, taza, gorra y buzo de LQLVE sobre un baúl, con dos polaroids"
                className="w-full"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ink-900 to-transparent lg:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900 to-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── La tienda ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow mb-4">Nuestra tienda</p>
              <h2 className="title-display text-4xl leading-[1.05] sm:text-5xl">
                Llevá <span className="italic text-gold-light">{brand.name}</span>
                <br />
                con vos.
              </h2>
              <p className="body-copy mt-6 max-w-md text-base leading-relaxed text-cream-200/80">
                Productos pensados para quienes creen en el poder de las historias. Objetos que te
                acompañan, te inspiran y te conectan.
              </p>
              <Link href="/tienda" className="btn-gold mt-8">
                <ShoppingBag size={16} /> Ir a la tienda <ArrowRight size={16} />
              </Link>

              <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden">
                <Ventaja icono={Gift} texto="Productos exclusivos" />
                <Ventaja icono={Truck} texto="Envíos a todo el país" separador />
                <Ventaja icono={Heart} texto="Apoyás el proyecto" separador />
              </div>
              <Firma className="mt-10" />
            </div>

            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/imagenes/home/tienda.webp"
                alt="Taza, gorra, remera y cuaderno de LQLVE sobre un baúl, con dos polaroids"
                className="w-full"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ink-900 to-transparent lg:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900 to-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Contá tu historia ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Las dos tiras de los costados son decoracion. En la referencia la
            foto esta partida en los dos bordes con el texto en el medio, asi
            que salieron dos recortes en vez de uno. Desde xl: mas abajo el
            texto llegaria hasta ellas y se le montarian encima. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[15%] xl:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/imagenes/home/contanos-izq.webp" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink-900 to-transparent" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[15%] xl:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/imagenes/home/contanos-der.webp" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink-900 to-transparent" />
        </div>

        <div className="container-page relative">
          <div className="relative mx-auto max-w-3xl text-center">
            {/* Anclado a este bloque y no al contenedor: el bloque mide 768
                fijos y va centrado, asi que nunca alcanza a las tiras de los
                costados, que son un 15% del ancho de la pantalla. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-24 hidden opacity-50 lg:block"
            >
              <Stamp />
            </div>
            <p className="eyebrow mb-4 flex items-center justify-center gap-2.5">
              <Mail size={16} /> Contá tu historia
            </p>
            <h2 className="title-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
              ¿Y si la próxima historia{' '}
              <span className="italic text-gold-light">es la tuya?</span>
            </h2>
            <p className="body-copy mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream-200/80">
              Nos encantaría escucharte. Contanos lo que te pasó, lo que aprendiste, o simplemente
              lo que necesitás decir.
            </p>
            <Link href="/contacto" className="btn-gold mt-8">
              Contanos <ArrowRight size={16} />
            </Link>
            <Firma className="mt-10 justify-center" />
          </div>
        </div>
      </section>
    </>
  )
}

/**
 * La linea con la firma de marca que cierra las cuatro secciones en las
 * referencias.
 */
function Firma({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-4 ${className}`}>
      <span className="h-px w-10 bg-gold/50" />
      <span className="text-[10px] uppercase tracking-[0.3em] text-cream-200/50">
        Historias que nos unen
      </span>
      <span className="h-px flex-1 bg-gold/20" />
    </div>
  )
}

/**
 * Cada una de las tres razones que acompañan al boton en Sorteos y Tienda.
 * El separador va como borde izquierdo y no como columna aparte para que las
 * tres midan lo mismo.
 */
function Ventaja({
  icono: Icono,
  texto,
  separador = false,
}: {
  icono: LucideIcon
  texto: string
  separador?: boolean
}) {
  return (
    <div className={`px-1.5 text-center sm:px-3 ${separador ? 'border-l border-cream-400/15' : ''}`}>
      <Icono size={22} strokeWidth={1.5} className="mx-auto text-gold" />
      {/* El espaciado entre letras baja en telefono y el texto puede cortar
          palabras: a 375 px cada columna mide 111 y "Experiencias" con el
          0,18em de escritorio se salia de su caja. */}
      <p className="mt-3 break-words text-[10px] uppercase leading-snug tracking-[0.08em] text-cream-200/75 sm:tracking-[0.18em]">
        {texto}
      </p>
    </div>
  )
}
