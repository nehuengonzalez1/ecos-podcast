'use client'

import Link from 'next/link'
import { ArrowRight, Clock, Infinity as Infinito } from 'lucide-react'
import { motion } from 'framer-motion'
import { CuentaRegresiva } from '@/components/CuentaRegresiva'
import type { EstadoSorteo } from '@/lib/sorteos'

/** Lo que la tarjeta necesita saber. Menos que el sorteo entero. */
export type SorteoTarjeta = {
  slug: string
  titulo: string
  categoria: string
  resumen: string
  imagen: string | null
  cierra: string
  estado: EstadoSorteo
  /**
   * El texto del tiempo ya calculado en el servidor.
   *
   * Viene resuelto de allá para que el HTML inicial diga lo mismo que el
   * primer render del navegador. Si el contador arrancara vacío, cada tarjeta
   * parpadearía al cargar; y si lo calculara solo en el cliente, React se
   * quejaría de que el HTML no coincide.
   */
  tiempoInicial: string
}

/**
 * Una tarjeta del listado de sorteos.
 *
 * El estado cambia qué invita a hacer: participar si está abierto, esperar si
 * todavía no abrió, y nada si ya cerró. Un botón "Participar" en un sorteo
 * terminado es una promesa que la página no puede cumplir.
 */
export function SorteoCard({ s, index = 0 }: { s: SorteoTarjeta; index?: number }) {
  const abierto = s.estado === 'activo'

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className={`group flex flex-col overflow-hidden rounded-sm border border-cream-400/10 bg-ink-800/70 transition ${
        abierto ? 'hover:border-gold/50' : ''
      }`}
    >
      <Link href={`/sorteos/${s.slug}`} className="block">
        <ImagenSorteo
          src={s.imagen}
          alt={s.titulo}
          className="aspect-[4/3]"
          apagada={s.estado === 'finalizado'}
        >
          <span className="absolute left-3 top-3 rounded-sm border border-cream-400/15 bg-ink-900/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cream-100/80 backdrop-blur">
            {s.categoria}
          </span>
        </ImagenSorteo>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/sorteos/${s.slug}`} className="block">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-cream-50">
            {s.titulo}
          </h3>
          <p className="mt-2 font-serif text-sm leading-relaxed text-cream-200/75">{s.resumen}</p>
        </Link>

        {/* Empuja el pie hacia abajo: sin esto, las tarjetas con bajadas de
            distinto largo dejan los botones a distinta altura. */}
        <div className="mt-auto pt-5">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cream-400/80">
            <Clock size={12} className="shrink-0" />
            <CuentaRegresiva cierra={s.cierra} inicial={s.tiempoInicial} formato="corto" />
          </p>

          {abierto ? (
            <Link
              href={`/sorteos/${s.slug}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-ink-900"
            >
              Participar <ArrowRight size={13} />
            </Link>
          ) : (
            <Link
              href={`/sorteos/${s.slug}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-cream-400/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-200/60 transition hover:border-cream-400/40 hover:text-cream-100"
            >
              {/* Un sorteo cerrado no dice "ver el resultado": el ganador se
                  contacta en privado y no se publica, asi que el boton estaria
                  prometiendo algo que la pagina no muestra. */}
              Ver el sorteo
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  )
}

/**
 * La foto del premio, o algo digno en su lugar.
 *
 * Todavía no hay fotos de los premios. Sin esto quedaría el ícono de imagen
 * rota del navegador, que ensucia toda la grilla; así, hasta que se carguen,
 * se ve una pieza de marca y la página se sostiene igual.
 */
export function ImagenSorteo({
  src,
  alt,
  className = '',
  apagada = false,
  children,
}: {
  src: string | null
  alt: string
  className?: string
  /** Los sorteos cerrados se muestran atenuados. */
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
            apagada ? 'opacity-40 grayscale' : ''
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
            <Infinito size={34} strokeWidth={1.25} />
            <span className="text-[9px] uppercase tracking-[0.35em]">LQLVE</span>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent" />
      {children}
    </div>
  )
}
