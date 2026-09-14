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
      {/* Sin borde: el marco claro recortaba la foto contra el fondo negro en
          vez de dejarla fundirse con la pagina, que es de lo que vive esta
          serie de retratos.

          El ancho ya no es fijo sino el de la celda, con un tope para que en
          pantallas muy anchas no se desproporcione. Asi las fotos crecen con
          la grilla en vez de quedarse chicas en el medio. */}
      {/* 5:6, la misma proporcion con la que estan recortadas las fotos. Que
          coincidan es lo que evita que object-cover vuelva a recortarlas por
          su cuenta y descoloque a unos respecto de otros. */}
      <div className="mx-auto aspect-[5/6] w-full max-w-[17rem] overflow-hidden bg-ink-700">
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
