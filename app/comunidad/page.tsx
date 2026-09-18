'use client'

import { SectionHeading } from '@/components/SectionHeading'
import { StatBlock } from '@/components/StatBlock'
import { SubscribeButton } from '@/components/SubscribeButton'
import stats from '@/data/stats.json'
import { Check, CreditCard, Layers, Play, Star, Unlock } from 'lucide-react'

export default function CommunityPage() {
  const price = Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS ?? '1500')

  return (
    <>
      <section className="relative overflow-hidden pt-24 pb-10">
        {/* Velo radial y no parejo: el titulo va centrado pero la escena
            tiene la gente grabando y las polaroids contra los bordes. */}
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/comunidad-cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-[18%_center] sm:object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.45) 55%, rgba(10,10,10,0.1) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>

        <div className="container-page relative flex flex-col justify-center py-6 text-center">
          <p className="eyebrow mb-4">La comunidad</p>
          <h1 className="title-display text-4xl leading-tight md:text-5xl">
            Ya somos miles creyendo que<br />
            las historias importan.
          </h1>
        </div>
      </section>

      {/* Las cartas, la taza y las polaroids van aca y no colgadas en el
          medio de la pagina. Esta franja es ancha y baja, casi la misma
          proporcion que la foto, asi que entra sin deformarse -- que es lo
          que fallaba cuando la puse detras de la suscripcion, que es alta. */}
      <section className="relative overflow-hidden py-16">
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/comunidad-cartas.webp"
            alt=""
            className="h-full w-full object-cover object-[20%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-ink-900/72" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>
        <div className="container-page relative space-y-16">
          <StatBlock stats={stats.primary} />
          <StatBlock stats={stats.secondary} />
        </div>
      </section>

      {/* Los estantes con las cajas por episodio: es literalmente lo que
          ofrece esta seccion, asi que dice mas que una foto cualquiera.

          Velo alto: aca hay una lista de beneficios y un precio que tienen
          que leerse, no solo un titulo.

          En telefono la seccion se vuelve alta y angosta contra una foto
          panoramica, asi que el recorte se queda con el centro, que en esta
          escena esta vacio. Ahi se encuadra sobre las cajas de la derecha,
          que son lo que la seccion promete. */}
      <section className="relative overflow-hidden border-y border-cream-400/10 py-20">
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/archivo-cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-[88%_center] sm:object-center"
          />
          {/* Mas oscuro que en las otras secciones: aca lo que tiene que
              leerse es la oferta, y la foto solo aporta clima. */}
          <div className="absolute inset-0 bg-ink-900/90" />
        </div>

        <div className="container-page relative">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">Archivo completo</p>
              <h2 className="title-display mt-3 text-6xl leading-[0.95] md:text-7xl">
                Sumate al
                <br />
                <span className="italic">Archivo</span>
              </h2>

              <p className="body-copy mt-6 max-w-lg text-lg leading-relaxed text-cream-200/85">
                Por ${price.toLocaleString('es-AR')} al mes accedés al detrás de escena de cada
                episodio, y bancás que estas historias se sigan contando.
                <br />
                Cancelás cuando quieras.
              </p>

              {/* Esta lista dice unicamente lo que hoy existe en el sitio.
                  Antes prometia cartas, regalos ocultos, audios y playlists:
                  de esos, la carta paso a ser gratuita, los regalos ocultos y
                  los objetos se sacaron de la pagina, y la playlist nunca
                  existio. Cobrar por cosas que no estan es la forma mas rapida
                  de que alguien se sienta estafado, asi que se enumera lo real
                  y se dice el resto como lo que es: un compromiso, no una
                  funcion ya entregada. */}
              <ul className="mt-8 space-y-4">
                {[
                  'El detrás de escena de cada episodio: los cortes que no salieron al aire',
                  'Lo que vayamos sumando al Archivo, incluido',
                  'Bancás que estas historias se sigan contando',
                  'Cancelás cuando quieras, desde tu cuenta, en un click',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                      <Check size={15} />
                    </span>
                    <span className="body-copy text-base leading-relaxed text-cream-100/90">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex items-center gap-4">
                <span className="h-px w-10 bg-gold/50" />
                <p className="subtitle-signature text-3xl">Gracias por ser parte</p>
                <span className="h-px flex-1 bg-gold/50" />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-cream-400/70">
                Historias que siguen vivas
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              {/* Las fotos y la nota salen de detras de la esquina de arriba
                  de la tarjeta, no centradas encima. Ancladas a la esquina se
                  leen como una sola pieza -- papeles que quedaron debajo --
                  en vez de tres objetos sueltos flotando aparte.

                  Van con z-0 y la tarjeta con z-10, y la tarjeta es opaca: con
                  el fondo semitransparente que tenia antes, las fotos se
                  transparentaban a traves de ella y ensuciaban el precio.

                  Asoman 96 px, que es casi todo el aire que hay entre la
                  tarjeta y el borde de la seccion: mas arriba las recortaria el
                  overflow-hidden de la seccion.

                  Se esconden en pantallas chicas: sobre una tarjeta angosta no
                  hay esquina libre donde apoyarlas sin taparle el borde. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 right-2 z-0 hidden items-start sm:flex"
              >
                <div className="w-36 -rotate-[7deg] rounded-[2px] bg-cream-100 p-2 pb-6 shadow-polaroid">
                  <img src="/imagenes/comunidad/polaroid-1.webp" alt="" className="aspect-[4/3] w-full object-cover" />
                </div>
                <div className="-ml-5 mt-3 w-36 rotate-[4deg] rounded-[2px] bg-cream-100 p-2 pb-6 shadow-polaroid">
                  <img src="/imagenes/comunidad/polaroid-2.webp" alt="" className="aspect-[4/3] w-full object-cover" />
                </div>
                <div className="-ml-4 mt-1 w-44 rotate-[6deg] rounded-[2px] bg-cream-200 px-5 py-5 shadow-polaroid">
                  <p className="font-hand text-xl leading-tight text-ink-800">
                    Detrás de cada historia hay mucho más.
                  </p>
                </div>
              </div>

              <div className="relative z-10 rounded-3xl border border-gold/40 bg-ink-900 p-6 shadow-soft sm:p-7">
                <p className="mx-auto w-fit rounded-full border border-gold/50 px-5 py-1.5 text-[10px] uppercase tracking-[0.3em] text-gold">
                  Acceso completo
                </p>

                {/* Inter, la misma de los rotulos de la tarjeta. Los digitos
                    ya salian de Inter por 'LQLVE Cifras', asi que con la de
                    titulos el "/mes" se quedaba solo en Now y el precio
                    mostraba dos tipografias pegadas. */}
                <p className="mt-5 text-center font-sans text-5xl font-bold leading-none text-cream-50 sm:text-6xl">
                  ${price.toLocaleString('es-AR')}
                  <span className="text-xl font-normal text-cream-200/60">/mes</span>
                </p>

                <div className="mt-5 flex items-center gap-4">
                  <span className="h-px flex-1 bg-cream-400/20" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cream-200/70">
                    Todo el archivo, siempre con vos
                  </p>
                  <span className="h-px flex-1 bg-cream-400/20" />
                </div>

                <SubscribeButton
                  className="mt-7"
                  price={price}
                  label="Suscribirme con Mercado Pago"
                  icono={<CreditCard size={16} />}
                  clasesBoton="flex w-full items-center justify-center gap-3 rounded-sm border border-gold/70 bg-gold/10 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-50 transition hover:bg-gold hover:text-ink-900 disabled:opacity-60"
                />

                <p className="mt-3 text-center text-[10px] text-cream-400/70">
                  Cobros vía Mercado Pago · Tarjeta, débito o saldo MP
                </p>

                {/* Los cuatro de abajo son los mismos beneficios de la lista,
                    resumidos para poder mirarlos de un vistazo. No agregan
                    ninguna promesa nueva, por lo mismo que la lista. */}
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 border-t border-cream-400/15 pt-7 sm:grid-cols-4">
                  {[
                    { icono: Play, titulo: 'Detrás de escena', texto: 'Los cortes que no salieron al aire.' },
                    { icono: Layers, titulo: 'Todo el archivo', texto: 'Cada episodio, cuando quieras.' },
                    { icono: Star, titulo: 'Lo nuevo primero', texto: 'Lo que sumemos, incluido.' },
                    { icono: Unlock, titulo: 'Sin ataduras', texto: 'Cancelás en un click.' },
                  ].map(({ icono: Icono, titulo, texto }) => (
                    <div key={titulo} className="px-1 text-center">
                      <Icono size={20} strokeWidth={1.4} className="mx-auto text-gold/80" />
                      <p className="mt-3 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-cream-50">
                        {titulo}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-snug text-cream-400/80">{texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
