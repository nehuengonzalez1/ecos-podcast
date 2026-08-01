'use client'

import { useMemo } from 'react'
import type { SubEvent } from '@/lib/subscriptions'

/**
 * Curva de altas y bajas por día, dibujada a mano en SVG.
 *
 * Se hace sin librería de gráficos a propósito: son dos series cortas y
 * sumar una dependencia de ~50 kB al bundle por esto no se justifica.
 */
export function Evolucion({ eventos, dias = 30 }: { eventos: SubEvent[]; dias?: number }) {
  const serie = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const buckets: { fecha: Date; altas: number; bajas: number }[] = []
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - i)
      buckets.push({ fecha: d, altas: 0, bajas: 0 })
    }
    for (const e of eventos) {
      const t = new Date(e.at)
      t.setHours(0, 0, 0, 0)
      const idx = buckets.findIndex((b) => b.fecha.getTime() === t.getTime())
      if (idx === -1) continue
      if (e.activated) buckets[idx].altas++
      else if (e.status === 'cancelled' || e.status === 'paused') buckets[idx].bajas++
    }
    return buckets
  }, [eventos, dias])

  const max = Math.max(1, ...serie.map((b) => Math.max(b.altas, b.bajas)))
  const W = 720
  const H = 160
  const pad = 24
  const paso = (W - pad * 2) / Math.max(1, serie.length - 1)
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2)
  const linea = (sel: (b: (typeof serie)[0]) => number) =>
    serie.map((b, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * paso} ${y(sel(b))}`).join(' ')

  const totalAltas = serie.reduce((a, b) => a + b.altas, 0)
  const totalBajas = serie.reduce((a, b) => a + b.bajas, 0)

  if (eventos.length === 0) {
    return (
      <div className="rounded-sm border border-cream-400/10 bg-ink-800/60 p-8 text-center">
        <p className="text-sm text-cream-200/70">Todavía no hay eventos registrados.</p>
        <p className="mt-2 text-[11px] text-cream-400/60">
          El registro empezó con este cambio. A medida que haya altas y bajas, la curva se dibuja acá.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-sm border border-cream-400/10 bg-ink-800/60 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.2em]">
        <span className="inline-flex items-center gap-2 text-gold">
          <span className="h-0.5 w-4 bg-gold" /> Altas · {totalAltas}
        </span>
        <span className="inline-flex items-center gap-2 text-cream-200/60">
          <span className="h-0.5 w-4 bg-cream-400/60" /> Bajas · {totalBajas}
        </span>
        <span className="ml-auto text-cream-400/50">últimos {dias} días</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Altas y bajas por día">
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={pad} x2={W - pad}
            y1={y(max * f)} y2={y(max * f)}
            stroke="currentColor" strokeWidth="1"
            className="text-cream-400/10"
          />
        ))}
        <path d={linea((b) => b.bajas)} fill="none" stroke="currentColor" strokeWidth="2" className="text-cream-400/50" />
        <path d={linea((b) => b.altas)} fill="none" stroke="#ff8000" strokeWidth="2" />
      </svg>

      <div className="mt-1 flex justify-between text-[10px] text-cream-400/50">
        <span>{serie[0]?.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
        <span>{serie[serie.length - 1]?.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
      </div>
    </div>
  )
}
