'use client'

import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { type Episode } from '@/components/EpisodeCard'
import { Polaroid } from '@/components/Polaroid'
import { Stamp } from '@/components/Stamp'

/**
 * La home quedo en dos secciones a proposito.
 *
 * Se sacaron cinco -- la apertura de la comunidad, las ultimas historias, lo
 * que quedo, el equipo y las estadisticas -- porque se van a rehacer. Quedan
 * la invitacion a contar y el cierre del archivo, que no entran en esa tanda.
 *
 * El diseno de la apertura que se saco esta en el commit anterior: se puede
 * recuperar entero con `git show 5093c38 -- app/HomeClient.tsx`.
 *
 * `episodios` sigue llegando aunque ninguna de las dos secciones lo use:
 * las nuevas lo van a necesitar, y desarmar la carga de datos de page.tsx
 * para rearmarla en el proximo paso no tiene sentido.
 */
export function HomeClient({ episodios: _episodios }: { episodios: Episode[] }) {
  return (
    <>
      {/* Primera de la pagina por ahora, asi que el pt despeja la barra
          de navegacion, que es fija y mide 80 px. Con el py-24 que tenia
          cuando estaba en el medio quedaban 16 px de aire y el titulo
          arrancaba pegado. Si se suma una seccion arriba, vuelve a py-24. */}
      <section className="pb-24 pt-32 md:pt-40">
        <div className="container-page">
          <div className="relative mx-auto max-w-4xl overflow-hidden border border-gold/30 bg-gradient-to-br from-ink-800/80 to-ink-700/60 p-10 md:p-14">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-3 text-gold">
                  <Mail size={20} />
                  <span className="eyebrow">Contá tu historia</span>
                </div>
                {/* h1 de la pagina. El que habia estaba en la apertura que se
                    saco, y una pagina sin h1 no tiene encabezado principal.
                    Solo cambia la etiqueta: el tamano lo fijan las clases. */}
                <h1 className="title-display mt-4 text-3xl md:text-4xl">
                  ¿Y si la próxima historia es la tuya?
                </h1>
                <p className="body-copy mt-4 max-w-lg text-base text-cream-200/80">
                  Nos encantaría escucharte. Contanos lo que te pasó, lo que aprendiste, o simplemente lo que necesitás decir.
                </p>
              </div>
              <Link href="/contacto" className="btn-gold whitespace-nowrap">
                Contanos <ArrowRight size={16} />
              </Link>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-40">
              <Stamp />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-32">
        <div className="container-page">
          <div className="relative mx-auto max-w-5xl overflow-hidden bg-ink-800/50 p-10 md:p-16">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="flex justify-center">
                {/* Foto propia y no un picsum, que era una imagen al azar de
                    un banco traida desde otro servidor: no cargaba siempre y
                    dejaba el marco en blanco. Esta es 800x1000, o sea el 4:5
                    exacto que pide el componente, asi que no se recorta. */}
                <Polaroid
                  src="/imagenes/estudio-polaroid.webp"
                  alt="El estudio de LQLVE"
                  caption="Bienvenida"
                  seed={7}
                  size="lg"
                />
              </div>
              <div>
                <p className="eyebrow mb-4">Un lugar</p>
                <h2 className="title-display text-3xl leading-tight md:text-4xl">
                  Donde las historias<br />
                  <span className="hand-underline">se quedan.</span>
                </h2>
                <p className="mt-6 text-sm text-cream-200/80">
                  Bienvenida al archivo de {brand.name}. Cada polaroid, cada carta, cada objeto acá es real. Y sigue creciendo con vos.
                </p>
                <div className="mt-8">
                  <Link href="/archivo" className="btn-gold">
                    {brand.cta.exploreArchive} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
