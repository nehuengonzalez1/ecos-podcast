'use client'

import { SectionHeading } from '@/components/SectionHeading'
import { StatBlock } from '@/components/StatBlock'
import { SubscribeButton } from '@/components/SubscribeButton'
import stats from '@/data/stats.json'
import { Sparkles, Check } from 'lucide-react'

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
          <div className="absolute inset-0 bg-ink-900/84" />
        </div>

        <div className="container-page relative">
          <SectionHeading
            eyebrow="Archivo completo"
            title={<>Sumate al <span className="italic">Archivo</span></>}
            subtitle={`Por $${price.toLocaleString('es-AR')} al mes accedés al detrás de escena de cada episodio, y bancás que estas historias se sigan contando. Cancelás cuando quieras.`}
          />
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            {/* Esta lista dice únicamente lo que hoy existe en el sitio.
                Antes prometía cartas, regalos ocultos, audios y playlists:
                de esos, la carta paso a ser gratuita, los regalos ocultos y
                los objetos se sacaron de la página, y la playlist nunca
                existió. Cobrar por cosas que no están es la forma más rápida
                de que alguien se sienta estafado, así que se enumera lo real
                y se dice el resto como lo que es: un compromiso, no una
                función ya entregada. */}
            <ul className="space-y-3 text-sm text-cream-200/90">
              {[
                'El detrás de escena de cada episodio: los cortes que no salieron al aire',
                'Lo que vayamos sumando al Archivo, incluido',
                'Bancás que estas historias se sigan contando',
                'Cancelás cuando quieras, desde tu cuenta, en un click',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col justify-center items-center gap-4 border border-gold/40 bg-ink-900/50 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="font-serif text-4xl text-cream-50">${price.toLocaleString('es-AR')}<span className="text-base text-cream-200/60">/mes</span></div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-cream-400/70">Acceso completo · Cancelación en 1 click</div>
              </div>
              <SubscribeButton price={price} label="Suscribirme con Mercado Pago" />
              <p className="text-[10px] text-cream-400/60">Cobros vía Mercado Pago · Tarjeta, débito o saldo MP</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
