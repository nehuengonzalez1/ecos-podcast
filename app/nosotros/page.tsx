'use client'

import { brand } from '@/lib/config/brand'
import { SectionHeading } from '@/components/SectionHeading'
import { TeamCard } from '@/components/TeamCard'
import { Polaroid } from '@/components/Polaroid'
import team from '@/data/team.json'

export default function TeamPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-16">
        {/* Acá el título va centrado, no pegado a un costado como en la
            tienda, así que el velo no puede ser un degradado lateral: seria
            oscuro de un lado y transparente del otro justo debajo del mismo
            texto. Se vela parejo y se abre arriba y abajo, que es donde la
            foto se tiene que fundir con el negro de la página. */}
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src="/imagenes/nosotros-cabecera.webp"
            alt=""
            className="h-full w-full object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-ink-900/60" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>

        <div className="container-page relative flex min-h-[22rem] flex-col justify-center text-center">
          <p className="eyebrow mb-4">05 · Nosotros</p>
          <h1 className="title-display text-5xl leading-none md:text-7xl">
            equipo de {brand.name}
          </h1>
          <p className="subtitle-signature mt-6 text-3xl md:text-4xl">
            Detrás de cada historia, hay un equipo que la hace posible
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          {/* Menos separacion en telefono: con dos columnas, cada pixel que
              se lleva el hueco se lo saca a la foto. Desde sm vuelve a
              abrirse, que es donde ya sobra ancho. */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-10 md:grid-cols-4">
            {team.members.map((m, i) => (
              <TeamCard key={m.name} member={m} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-800/40 py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Nuestro manifiesto"
            title={<>Contar historias es<br /><span className="italic">un acto de cuidado.</span></>}
          />
          <div className="mx-auto mt-14 grid max-w-4xl gap-10 md:grid-cols-[auto_1fr] md:items-center">
            {/* size="lg" quedaba mas alto que el manifiesto; el max-w lo
                acota sin pelear con el `w-*` del componente. */}
            <Polaroid
              src="/imagenes/estudio-polaroid.webp"
              alt="El sillón y el micrófono del estudio de LQLVE, iluminados por un foco"
              caption="El estudio"
              seed={11}
              size="lg"
              className="max-w-[340px]"
            />
            <div className="body-copy space-y-4 text-lg text-cream-200/90">
              <p>Lo Que La Vida Esconde nace de una idea simple: todos tenemos una historia que el mundo no ve.</p>
              <p>Vivimos rodeados de apariencias, conclusiones rápidas y conversaciones superficiales.</p>
              <p>Vemos resultados, pero pocas veces conocemos los procesos. Escuchamos lo que pasó, pero rara vez entendemos cómo se sintió.</p>
              <p>Creemos que detrás de cada persona hay emociones, luchas, aprendizajes, miedos y cicatrices que merecen ser escuchadas.</p>
              <p>Por eso creamos un espacio seguro para hablar sin máscaras, sin personajes y sin juicios.</p>
              <p>Un lugar donde las historias importan, pero las emociones que viven detrás de ellas importan todavía más.</p>
              <p>Porque cuando una persona se anima a abrirse, muchas otras descubren que no están solas.</p>
              <p>Y cuando dejamos de escondernos, empezamos a entendernos.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
