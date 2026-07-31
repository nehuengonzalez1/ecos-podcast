'use client'

import { motion } from 'framer-motion'

type Member = { name: string; role: string; description: string; photo: string }

export function TeamCard({ member, index = 0 }: { member: Member; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="text-center"
    >
      <div className="mx-auto aspect-square w-40 overflow-hidden border border-cream-400/15 bg-ink-700 sm:w-48">
        <img
          src={member.photo}
          alt={member.name}
          loading="lazy"
          className="h-full w-full object-cover grayscale-[20%] transition duration-500 hover:grayscale-0"
        />
      </div>
      <div className="mt-4 font-serif text-xl text-cream-50">{member.name}</div>
      {/* Altura reservada para que el parrafo arranque siempre a la misma
          altura, sin importar si el rol ocupa 1, 2 o 3 lineas.
          line-height del rol = 15px: 3 lineas hasta 1279px y 2 desde xl,
          que es el ancho a partir del cual ningun rol pasa de 2 lineas
          (a 1024 todavia hay de 3, por eso el corte no va en lg). */}
      <div className="mt-0.5 flex min-h-[45px] items-start justify-center text-[10px] uppercase leading-[15px] tracking-[0.3em] text-gold/80 xl:min-h-[30px]">
        {member.role}
      </div>
      <p className="mx-auto mt-3 max-w-xs font-serif text-sm italic text-cream-200/70">
        {member.description}
      </p>
    </motion.article>
  )
}
