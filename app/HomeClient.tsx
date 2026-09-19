'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
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
 * La portada y las cuatro secciones de la home.
 *
 * La portada es la de siempre. Las otras cuatro salieron de las
 * referencias.
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
      {/* ── La portada ────────────────────────────────────────────────
          Vuelve tal cual estaba. Se habia ido junto con la seccion de la
          comunidad que la habia reemplazado, pero esa se saco despues y la
          portada nunca tuvo que irse con ella. */}
      <section className="relative min-h-[92vh] overflow-hidden pt-24">
        {/* La foto es 3:2 y la portada ocupa casi toda la pantalla. En un
            telefono -- mucho mas alto que ancho -- object-cover se queda con
            una franja angosta del medio, y el medio de esta foto esta vacio a
            proposito: los dos sillones estan contra los bordes opuestos.

            No hay encuadre que los salve a los dos, asi que en pantallas
            chicas se corre casi al borde izquierdo y se muestra uno
            entero. Desde sm entran los dos y vuelve al centro. */}
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/inicio-cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-[8%_55%] sm:object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 60% at 50% 45%, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.66) 55%, rgba(10,10,10,0.28) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>
        <div className="container-page relative z-10 flex min-h-[80vh] flex-col items-center justify-center text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="eyebrow mb-6"
          >
            {brand.fullName}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            className="title-display max-w-4xl text-5xl leading-[1.05] sm:text-6xl md:text-7xl"
          >
            Hay historias<br />
            que cambian vidas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="subtitle-signature mt-6 max-w-xl text-3xl sm:text-4xl"
          >
            Algunas todavía no fueron contadas.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            {/* Ambos con el mismo ancho, padding, tamaño de texto y radio.
                Las utilidades pisan a .btn-gold y .btn-ghost, que por defecto
                son más chicos y de esquina casi recta. */}
            <Link href="/archivo" className="btn-gold w-full justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm tracking-[0.18em] sm:w-72">
              {brand.cta.exploreArchive} <ArrowRight size={16} />
            </Link>
            <Link href="/contacto" className="btn-ghost w-full justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm tracking-[0.18em] sm:w-72">
              {brand.cta.tellStory}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream-400/60"
          >
            <span className="text-[10px] uppercase tracking-[0.4em]">Scroll</span>
            <ChevronDown size={18} className="animate-float-slow" />
          </motion.div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-900 to-transparent" />
      </section>

      {/* ── El archivo ──────────────────────────────────────────────────
          Ya no es la primera de la pagina, asi que no necesita despejar la
          barra de navegacion: de eso se encarga el pt-24 de la portada. El
          aire de arriba y abajo lo pone ahora la columna del texto, porque
          la seccion no puede llevar padding sin separar la foto del borde. */}
      <section className="relative overflow-hidden">
        {/* El min-h va en la grilla y no en la seccion: en la seccion, la
            grilla no se estiraba hasta el y quedaba un hueco negro abajo de
            la foto -- medido, 14 px en el archivo y 44 en sorteos. */}
        <div className="grid lg:min-h-[39vw] lg:grid-cols-2 lg:items-stretch">
          {/* La foto sangra hasta el canto de la pantalla: la grilla ya no
              vive adentro de container-page, asi que esta columna llega al
              borde. Desde lg se estira al alto de la fila con object-cover, y
              el min-h de la seccion -- 39vw -- esta calculado para que media
              pantalla quede casi en la proporcion de la foto y el recorte sea
              minimo. En telefono va con su alto natural, sin recorte. */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagenes/home/archivo.webp"
              alt="Una pila de polaroids del estudio apoyada sobre un cuaderno de LQLVE"
              className="w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover"
            />
            {/* El canto interior se funde con la columna del texto, y los de
                arriba y abajo con la seccion vecina: ahora que las fotos
                sangran, dos que quedan una debajo de la otra se cortan en una
                linea recta. El degradado es mas corto en telefono, donde la
                foto entra con su alto natural: medido a 375, mide 290, y los
                96 px de escritorio arriba y abajo le taparian dos tercios. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-ink-900 to-transparent lg:block"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-ink-900 to-transparent lg:h-24"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-900 to-transparent lg:h-24"
            />
          </div>

          <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:py-16 lg:pl-12 lg:pr-[max(3rem,calc((100vw-80rem)/2+3rem))]">
            <div className="relative">
              <p className="eyebrow mb-4">Un lugar</p>
              {/* h2 y no h1: el h1 de la pagina es el de la portada. */}
              <h2 className="title-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Donde las{' '}
                <span className="hand-underline italic">historias</span>
                <br />
                se quedan.
              </h2>
              <p className="body-copy mt-6 max-w-md text-base leading-relaxed text-cream-200/80">
                Bienvenida al archivo de {brand.name}. Cada polaroid, cada carta, cada objeto acá es
                real. Y sigue creciendo con vos.
              </p>
              <Link href="/archivo" className="btn-gold mt-8 rounded-xl">
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
      <section className="relative overflow-hidden">
        {/* El min-h va en la grilla y no en la seccion: en la seccion, la
            grilla no se estiraba hasta el y quedaba un hueco negro abajo de
            la foto -- medido, 14 px en el archivo y 44 en sorteos. */}
        <div className="grid lg:min-h-[39vw] lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:py-16 lg:pr-12 lg:pl-[max(3rem,calc((100vw-80rem)/2+3rem))]">
            <div>
              <p className="eyebrow mb-4">Sorteos</p>
              <h2 className="title-display text-4xl leading-[1.05] sm:text-5xl">
                Ganá con <span className="italic text-gold-light">{brand.name}</span>.
              </h2>
              <p className="body-copy mt-6 max-w-md text-base leading-relaxed text-cream-200/80">
                Participá de nuestros sorteos y llevate productos, experiencias y mucho más. Porque
                ser parte también tiene recompensas.
              </p>
              <Link href="/sorteos" className="btn-gold mt-8 rounded-xl">
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
          </div>

          {/* La foto sangra hasta el canto de la pantalla: la grilla ya no
              vive adentro de container-page, asi que esta columna llega al
              borde. Desde lg se estira al alto de la fila con object-cover, y
              el min-h de la seccion -- 39vw -- esta calculado para que media
              pantalla quede casi en la proporcion de la foto y el recorte sea
              minimo. En telefono va con su alto natural, sin recorte. */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagenes/home/sorteos.webp"
              alt="Caja, taza, gorra y buzo de LQLVE sobre un baúl, con dos polaroids"
              className="w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover"
            />
            {/* El canto interior se funde con la columna del texto, y los de
                arriba y abajo con la seccion vecina: ahora que las fotos
                sangran, dos que quedan una debajo de la otra se cortan en una
                linea recta. El degradado es mas corto en telefono, donde la
                foto entra con su alto natural: medido a 375, mide 290, y los
                96 px de escritorio arriba y abajo le taparian dos tercios. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ink-900 to-transparent lg:block"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-ink-900 to-transparent lg:h-24"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-900 to-transparent lg:h-24"
            />
          </div>
        </div>
      </section>

      {/* ── La tienda ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* El min-h va en la grilla y no en la seccion: en la seccion, la
            grilla no se estiraba hasta el y quedaba un hueco negro abajo de
            la foto -- medido, 14 px en el archivo y 44 en sorteos. */}
        <div className="grid lg:min-h-[39vw] lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:py-16 lg:pr-12 lg:pl-[max(3rem,calc((100vw-80rem)/2+3rem))]">
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
              <Link href="/tienda" className="btn-gold mt-8 rounded-xl">
                <ShoppingBag size={16} /> Ir a la tienda <ArrowRight size={16} />
              </Link>

              <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden">
                <Ventaja icono={Gift} texto="Productos exclusivos" />
                <Ventaja icono={Truck} texto="Envíos a todo el país" separador />
                <Ventaja icono={Heart} texto="Apoyás el proyecto" separador />
              </div>
              <Firma className="mt-10" />
            </div>

          </div>

          {/* La foto sangra hasta el canto de la pantalla: la grilla ya no
              vive adentro de container-page, asi que esta columna llega al
              borde. Desde lg se estira al alto de la fila con object-cover, y
              el min-h de la seccion -- 39vw -- esta calculado para que media
              pantalla quede casi en la proporcion de la foto y el recorte sea
              minimo. En telefono va con su alto natural, sin recorte. */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagenes/home/tienda.webp"
              alt="Taza, gorra, remera y cuaderno de LQLVE sobre un baúl, con dos polaroids"
              className="w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover"
            />
            {/* El canto interior se funde con la columna del texto, y los de
                arriba y abajo con la seccion vecina: ahora que las fotos
                sangran, dos que quedan una debajo de la otra se cortan en una
                linea recta. El degradado es mas corto en telefono, donde la
                foto entra con su alto natural: medido a 375, mide 290, y los
                96 px de escritorio arriba y abajo le taparian dos tercios. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ink-900 to-transparent lg:block"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-ink-900 to-transparent lg:h-24"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-900 to-transparent lg:h-24"
            />
          </div>
        </div>
      </section>

      {/* ── Contá tu historia ─────────────────────────────────────────── */}
      {/* El py es mas alto que el de las otras: la referencia es una franja
          de 3,06 a 1 y con el py-16 de las demas esta quedaba en 3,47. */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* La escena entera, de un canto al otro. Reemplaza lo que habia
            antes -- una textura reconstruida y dos tiras recortadas en los
            costados -- porque ahora existe la imagen sin el texto encima y no
            hay nada que reconstruir.

            El velo es bajo, 25%, y no el 60% de antes: medida la imagen, la
            franja donde cae el texto tiene una luminancia media de 7 sobre
            255, o sea que ya es casi negra sola. Un velo alto no la haria mas
            legible y si apagaria la lampara de la izquierda y las polaroids
            de la derecha, que son lo que da la escena. */}
        <div aria-hidden="true" className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/home/contanos-fondo.webp"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink-900/25" />
          {/* Se funde con las secciones de arriba y de abajo. Aca la escena
              cubre el ancho completo, asi que el degradado tambien. */}
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-ink-900 to-transparent lg:h-24" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-900 to-transparent lg:h-24" />
        </div>

        <div className="container-page relative">
          {/* Tres columnas: texto, boton y sello.

              Las dos primeras son auto, asi que cada una ocupa lo que mide y
              el boton queda pegado al texto. Antes la primera era 1fr y se
              comia todo el sobrante: el boton se iba contra el borde y
              quedaban 410 px de vacio entre el final del titulo y el.

              La tercera columna no tiene hijo a proposito: es 1fr y esta solo
              para comerse el sobrante. Sin ella, las dos auto se reparten el
              espacio libre y el boton se vuelve a ir contra el borde. */}
          {/* El pl corre el contenido a la derecha, como en la referencia, y
              de paso lo despega de la tira de la izquierda: sin el, el texto
              arrancaba en 120 y la tira llega hasta 214. */}
          <div className="grid items-center gap-10 lg:grid-cols-[auto_auto_minmax(0,1fr)] lg:gap-12 lg:pl-20 xl:pl-32">
            <div>
              <p className="eyebrow mb-4 flex items-center gap-2.5">
                <Mail size={16} /> Contá tu historia
              </p>
              <h2 className="title-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
                ¿Y si la próxima<br />
                historia <span className="italic text-gold-light">es la tuya?</span>
              </h2>
              <p className="body-copy mt-6 max-w-xl text-base leading-relaxed text-cream-200/80">
                Nos encantaría escucharte. Contanos lo que te pasó, lo que aprendiste, o simplemente
                lo que necesitás decir.
              </p>
              <Firma className="mt-8 max-w-lg" />
            </div>

            <div className="relative justify-self-start">
              {/* El sello va arriba del boton, no al lado: es donde esta en la
                  referencia, y al lado no entra -- entre el boton y la tira de
                  la derecha quedan 117 px y el sello mide 128.

                  Cuelga del boton y no de la grilla ni de un porcentaje del
                  ancho, asi lo acompaña a cualquier tamaño de pantalla. Las
                  dos veces anteriores que se anclo a otra cosa, termino
                  cruzandose con algo al mover cualquier otra pieza.

                  Del borde izquierdo del boton y no del derecho: medida la
                  luminancia del fondo justo debajo, a la derecha caia sobre
                  las polaroids -- media 39 sobre 255 -- y a la izquierda cae
                  sobre la pared, media 9, igual que el titulo. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 left-0 hidden opacity-50 lg:block"
              >
                <Stamp />
              </div>

              {/* El resplandor esta en la referencia y .btn-gold no lo trae:
                  es lo que despega al boton del fondo ahora que quedo en el
                  medio de la franja. */}
              <Link
                href="/contacto"
                className="btn-gold rounded-xl px-10 py-4 shadow-[0_0_45px_-10px_rgba(255,128,0,0.65)] lg:px-12"
              >
                Contanos <ArrowRight size={16} />
              </Link>
            </div>
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
