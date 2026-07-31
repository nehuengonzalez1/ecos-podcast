'use client'

import { brand } from '@/lib/config/brand'
import { SectionHeading } from '@/components/SectionHeading'
import { TeamCard } from '@/components/TeamCard'
import { Polaroid } from '@/components/Polaroid'
import team from '@/data/team.json'

export default function TeamPage() {
  return (
    <>
      <section className="spotlight-bg pt-32 pb-16">
        <div className="container-page text-center">
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
          <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-5">
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
            <Polaroid src="https://picsum.photos/seed/team-polaroid/800/1000" alt="Equipo" caption="Equipo" seed={11} size="md" />
            <div className="body-copy space-y-4 text-lg text-cream-200/90">
              <p>Lo Que La Vida Esconde nace de una idea simple: todos tenemos una historia que el mundo no ve.</p>
              <p>Vivimos rodeados de apariencias, conclusiones rápidas y conversaciones superficiales. Vemos resultados, pero pocas veces conocemos los procesos. Escuchamos lo que pasó, pero rara vez entendemos cómo se sintió.</p>
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
