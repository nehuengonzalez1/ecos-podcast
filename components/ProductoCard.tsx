'use client'

import Link from 'next/link'
import { Infinity as Infinito } from 'lucide-react'
import { motion } from 'framer-motion'

export type ProductoTarjeta = {
  slug: string
  nombre: string
  categoria: string
  resumen: string
  imagen: string | null
  precio: string
  agotado: boolean
}

export function ProductoCard({ p, index = 0 }: { p: ProductoTarjeta; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="group flex flex-col overflow-hidden rounded-sm border border-cream-400/10 bg-ink-800/70 transition hover:border-gold/40"
    >
      <Link href={`/tienda/${p.slug}`} className="block">
        <ImagenProducto src={p.imagen} alt={p.nombre} className="aspect-square" apagada={p.agotado}>
          {p.agotado && (
            <span className="absolute left-3 top-3 rounded-sm border border-cream-400/25 bg-ink-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cream-200/80 backdrop-blur">
              Agotado
            </span>
          )}
        </ImagenProducto>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/tienda/${p.slug}`} className="block">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cream-400/70">{p.categoria}</p>
          <h3 className="mt-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-cream-50">
            {p.nombre}
          </h3>
          <p className="mt-2 font-serif text-sm leading-relaxed text-cream-200/75">{p.resumen}</p>
        </Link>

        {/* Empuja el precio abajo: sin esto, las tarjetas con bajadas de
            distinto largo dejan los precios a distinta altura. */}
        <p className="mt-auto pt-5 text-sm text-gold">{p.precio}</p>
      </div>
    </motion.article>
  )
}

/**
 * La foto del producto, o una pieza de marca mientras no la haya.
 *
 * Todavía no hay fotos sueltas de cada cosa: las que existen están todas en
 * una misma toma del kit. Sin esto quedaría el ícono de imagen rota del
 * navegador, que ensucia toda la grilla.
 */
export function ImagenProducto({
  src,
  alt,
  className = '',
  apagada = false,
  children,
}: {
  src: string | null
  alt: string
  className?: string
  apagada?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-ink-700 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] ${
            apagada ? 'opacity-45 grayscale' : ''
          }`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-600 via-ink-800 to-ink-900 ${
            apagada ? 'opacity-50' : ''
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-cream-400/25">
            <Infinito size={32} strokeWidth={1.25} />
            <span className="text-[9px] uppercase tracking-[0.35em]">LQLVE</span>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
