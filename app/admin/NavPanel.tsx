'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, SlidersHorizontal, Ticket, ShoppingBag } from 'lucide-react'

/**
 * Las dos mitades del panel.
 *
 * Estan en rutas separadas y no en pestañas de una sola pagina a proposito:
 * asi entrar a editar un episodio no carga suscriptores, analitica ni la cola
 * de moderacion, que es lo que pasaba cuando todo vivia junto. Cada mitad
 * pide solo sus datos.
 */
const SECCIONES = [
  { href: '/admin', texto: 'Métricas', icono: BarChart3 },
  { href: '/admin/contenido', texto: 'Contenido', icono: SlidersHorizontal },
  { href: '/admin/sorteos', texto: 'Sorteos', icono: Ticket },
  { href: '/admin/tienda', texto: 'Tienda', icono: ShoppingBag },
]

export function NavPanel() {
  const pathname = usePathname()

  return (
    <nav className="mt-6 flex flex-wrap gap-2 border-b border-cream-400/10 pb-4">
      {SECCIONES.map(({ href, texto, icono: Icono }) => {
        // Coincidencia exacta: con `startsWith`, "Métricas" quedaria marcada
        // como activa tambien estando en /admin/contenido.
        const activa = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition ${
              activa
                ? 'border-gold/60 bg-gold/10 text-gold'
                : 'border-cream-400/20 text-cream-200/70 hover:border-gold/40 hover:text-gold'
            }`}
          >
            <Icono size={13} /> {texto}
          </Link>
        )
      })}
    </nav>
  )
}
