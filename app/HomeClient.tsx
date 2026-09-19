'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Mail, Mic, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { SectionHeading } from '@/components/SectionHeading'
import { EpisodeCard, type Episode } from '@/components/EpisodeCard'
import { StatBlock } from '@/components/StatBlock'
import { TeamCard } from '@/components/TeamCard'
import { Polaroid } from '@/components/Polaroid'
import { Stamp } from '@/components/Stamp'
import team from '@/data/team.json'
import stats from '@/data/stats.json'

export function HomeClient({ episodios }: { episodios: Episode[] }) {
  const available = episodios.filter((e) => e.status === 'available')
  const latest = available.slice(0, 4)

  return (
    <>
      {/* La apertura de la home.

          Antes habia una portada a pantalla casi completa con la foto del
          estudio y el titulo de marca, y recien despues venia el bloque de la
          comunidad. Ahora la comunidad ES la apertura: no se duplica, se
          movio y se redibujo segun la referencia.

          El fondo es la foto del sillon y los estantes con las cajas por
          episodio. Se eligio midiendo, no a ojo. La seccion es de 2,53 a 1 en
          escritorio y esta foto es 2,34, la mas parecida; y sobre todo es la
          unica cuyo centro conserva todo el contraste de la escena al
          recortarse. Las de las cartas y la cabecera de comunidad son mas
          panoramicas -- 3,44 y 3,70 -- pero tienen el centro vacio: medido,
          entre el 25 y el 75 por ciento del ancho el contraste cae de 12 a 3,
          asi que object-cover las dejaba en una mancha oscura. */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/archivo-cabecera.webp"
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Velo radial y no parejo. Encima hay un titular, una bajada y tres
              tarjetas con textos chicos, asi que el centro tiene que ir bien
              tapado; pero con el 85% plano que tenia antes la foto no se veia
              en ningun lado y daba igual poner una. Abierto en los bordes, que
              es donde el contenido no llega, la escena aparece. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(10,10,10,0.93) 0%, rgba(10,10,10,0.84) 55%, rgba(10,10,10,0.55) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>

        {/* El nombre del sitio vuelve como manuscrita, ahora que salio de la
            barra de navegacion. Desde xl: mas abajo no hay margen libre a la
            derecha y se montaria sobre las tarjetas. */}
        <p
          aria-hidden="true"
          className="absolute right-8 top-28 z-10 hidden -rotate-6 text-right font-hand text-3xl leading-tight text-cream-100/75 xl:block"
        >
          Lo que<br />la vida<br />esconde
          <span className="mt-2 ml-auto block h-px w-20 bg-gold/70" />
        </p>

        <div className="container-page relative z-10 pb-20 pt-32 md:pb-24 md:pt-36">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <p className="eyebrow mb-4">La comunidad</p>
              <h1 className="title-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Más de<br />
                <span className="text-gold">1.000.000</span><br />
                de personas ya<br />
                escucharon una historia.
              </h1>
              <p className="body-copy mt-6 max-w-md text-base leading-relaxed text-cream-200/75">
                Y seguimos creciendo. Cada episodio deja una huella, un pensamiento, un momento que se queda.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  {latest.slice(0, 4).map((e) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={e.id}
                      src={e.photo!}
                      alt=""
                      className="h-11 w-11 rounded-full border border-cream-400/20 object-cover"
                    />
                  ))}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cream-400/20 bg-ink-800 text-[11px] text-cream-200/70">
                    +9
                  </div>
                </div>
                <span aria-hidden="true" className="hidden h-12 w-px bg-cream-400/20 sm:block" />
                <p className="font-hand text-2xl leading-tight text-cream-100/90">
                  Historias<br />que nos unen.
                  <span aria-hidden="true" className="mt-2 block h-px w-28 bg-gold/70" />
                </p>
              </div>
            </div>

            {/* Una columna en telefono. A tres, cada tarjeta quedaba en unos
                cien pixeles y el circulo del icono no entraba con su texto. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <TarjetaComunidad
                icono={Mic}
                titulo="Historias"
                texto="Conocé a quienes se animaron a contar."
                to="/archivo"
              />
              <TarjetaComunidad
                icono={BookOpen}
                titulo="Archivo"
                texto="Explorá cada episodio, cartas, regalos y más."
                to="/archivo"
              />
              <TarjetaComunidad
                icono={Users}
                titulo="Comunidad"
                texto="Vení también vos a ser parte de esta historia."
                to="/comunidad"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Últimas historias"
            title={<>Historias reales.<br /><span>Conversaciones que quedan.</span></>}
            subtitle="Cada persona tiene algo para contar. Cada historia, algo para enseñarnos."
          />
          <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {latest.map((e, i) => (
              <EpisodeCard key={e.id} episode={e} variant="home" index={i} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/archivo" className="btn-ghost">
              Ver todo el archivo <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-ink-800/40 py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Lo que quedó"
            title={<>Más que un episodio.<br /><span>Recuerdos que se quedan.</span></>}
            subtitle="Cada historia deja algo. La carta y el regalo quedan para todos; el detrás de escena, para quien se suma al Archivo Completo."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <RemainsCard icon="✉" title="La Carta" text="La carta que le escribimos a cada invitado." />
            <RemainsCard icon="◱" title="El regalo" text="Lo que le dejamos a cada invitado." />
            <RemainsCard icon="♪" title="Detrás de escena" text="Los cortes que no salieron al aire." />
            <RemainsCard icon="◯" title="El muro" text="Lo que le dejó la gente que lo escuchó." />
          </div>
          <div className="mt-10 text-center">
            <Link href="/cuenta?upgrade=1" className="btn-gold">
              Sumate al Archivo Completo <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <div className="relative mx-auto max-w-4xl overflow-hidden border border-gold/30 bg-gradient-to-br from-ink-800/80 to-ink-700/60 p-10 md:p-14">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-3 text-gold">
                  <Mail size={20} />
                  <span className="eyebrow">Contá tu historia</span>
                </div>
                <h3 className="title-display mt-4 text-3xl md:text-4xl">
                  ¿Y si la próxima historia es la tuya?
                </h3>
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

      <section className="bg-ink-800/40 py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="05 · Nosotros"
            title={<>Detrás de cada historia,<br /><span className="italic">hay un equipo que la hace posible.</span></>}
          />
          <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            {team.members.map((m, i) => (
              <TeamCard key={m.name} member={m} index={i} />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-cream-200/70">
            {brand.name} no es solo un podcast. Es un lugar seguro donde las historias se cuentan con respeto, profundidad y verdad.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/nosotros" className="btn-ghost">
              Conocé más sobre nosotros <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="La comunidad"
            title={<>Ya somos miles creyendo que<br /><span className="italic">las historias importan.</span></>}
          />
          <div className="mt-14 space-y-14">
            <StatBlock stats={stats.primary} />
            <StatBlock stats={stats.secondary} />
          </div>
        </div>
      </section>

      <section className="pb-32">
        <div className="container-page">
          <div className="relative mx-auto max-w-5xl overflow-hidden bg-ink-800/50 p-10 md:p-16">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="flex justify-center">
                <Polaroid
                  src="https://picsum.photos/seed/inv-polaroid/800/1000"
                  alt="Estudio"
                  caption="Bienvenida"
                  seed={7}
                  size="lg"
                />
              </div>
              <div>
                <p className="eyebrow mb-4">Un lugar</p>
                <h3 className="title-display text-3xl leading-tight md:text-4xl">
                  Donde las historias<br />
                  <span className="hand-underline">se quedan.</span>
                </h3>
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

function TarjetaComunidad({
  icono: Icono,
  titulo,
  texto,
  to,
}: {
  icono: LucideIcon
  titulo: string
  texto: string
  to: string
}) {
  return (
    <Link
      href={to}
      className="group flex flex-col items-center rounded-2xl border border-cream-400/10 bg-ink-900/60 p-5 text-center backdrop-blur-sm transition hover:border-gold/50"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold">
        <Icono size={24} strokeWidth={1.5} />
      </span>
      <span className="eyebrow mt-5 text-gold/90">{titulo}</span>
      <p className="mt-3 text-xs leading-relaxed text-cream-200/75">{texto}</p>
      {/* mt-auto empuja el enlace al piso: sin esto, con bajadas de distinto
          largo los "Ver mas" de las tres tarjetas quedan a distinta altura. */}
      <span className="mt-auto flex flex-col items-center gap-1.5 pt-6 text-[10px] uppercase tracking-[0.25em] text-cream-100/75 group-hover:text-gold">
        <span className="flex items-center gap-1.5">
          Ver más <ArrowRight size={12} />
        </span>
        <span aria-hidden="true" className="h-px w-16 bg-gold/60" />
      </span>
    </Link>
  )
}

function RemainsCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="card-panel text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 text-2xl text-gold">
        {icon}
      </div>
      <div className="font-serif text-xl text-cream-50">{title}</div>
      <p className="mt-2 text-xs text-cream-200/70">{text}</p>
    </div>
  )
}
