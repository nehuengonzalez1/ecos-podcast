'use client'

import { useMemo, useState } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'
import type { Suscriptor } from '@/lib/admin-data'

type Orden = 'antiguedad' | 'nombre' | 'reciente'
type Filtro = 'todos' | 'activos' | 'cancelados'

function fecha(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString('es-AR') : '—'
}

function antiguedad(dias: number | null): string {
  if (dias === null) return '—'
  if (dias === 0) return 'hoy'
  if (dias === 1) return '1 día'
  if (dias < 30) return `${dias} días`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return meses === 1 ? '1 mes' : `${meses} meses`
  const años = Math.floor(meses / 12)
  return años === 1 ? '1 año' : `${años} años`
}

export function SuscriptoresTabla({ subs }: { subs: Suscriptor[] }) {
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [orden, setOrden] = useState<Orden>('antiguedad')

  const visibles = useMemo(() => {
    const query = q.trim().toLowerCase()
    let r = subs.filter((s) => {
      if (filtro === 'activos' && !s.active) return false
      if (filtro === 'cancelados' && s.active) return false
      if (!query) return true
      return (
        s.nombre.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.userId.toLowerCase().includes(query)
      )
    })
    r = [...r].sort((a, b) => {
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre)
      if (orden === 'reciente') return (b.activatedAt ?? '').localeCompare(a.activatedAt ?? '')
      return (b.diasSuscripto ?? -1) - (a.diasSuscripto ?? -1)
    })
    return r
  }, [subs, q, filtro, orden])

  const botonFiltro = (v: Filtro, label: string, n: number) => (
    <button
      key={v}
      onClick={() => setFiltro(v)}
      className={`rounded-sm border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${
        filtro === v
          ? 'border-gold bg-gold/10 text-gold'
          : 'border-cream-400/15 text-cream-200/70 hover:border-gold/50 hover:text-cream-50'
      }`}
    >
      {label} · {n}
    </button>
  )

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {botonFiltro('todos', 'Todos', subs.length)}
          {botonFiltro('activos', 'Activos', subs.filter((s) => s.active).length)}
          {botonFiltro('cancelados', 'Cancelados', subs.filter((s) => !s.active).length)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOrden(orden === 'antiguedad' ? 'reciente' : orden === 'reciente' ? 'nombre' : 'antiguedad')}
            className="inline-flex items-center gap-1.5 rounded-sm border border-cream-400/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-cream-200/70 transition hover:border-gold/50 hover:text-cream-50"
            title="Cambiar orden"
          >
            <ArrowUpDown size={12} />
            {orden === 'antiguedad' ? 'Más antiguos' : orden === 'reciente' ? 'Más nuevos' : 'Por nombre'}
          </button>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-200/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="w-full rounded-sm border border-cream-400/15 bg-ink-900/70 py-2 pl-9 pr-3 text-xs text-cream-100 placeholder:text-cream-400/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-cream-400/10 bg-ink-800/60">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-cream-400/70">
            <tr className="border-b border-cream-400/10">
              <th className="px-4 py-3">Suscriptor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Antigüedad</th>
              <th className="px-4 py-3">Se suscribió</th>
              <th className="px-4 py-3">Se registró</th>
              <th className="px-4 py-3">Último ingreso</th>
              <th className="px-4 py-3">Último evento</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-cream-400/70">
                  {subs.length === 0 ? 'Todavía no hay suscriptores registrados.' : 'Ningún resultado con esos criterios.'}
                </td>
              </tr>
            )}
            {visibles.map((s) => (
              <tr key={s.userId} className="border-b border-cream-400/5 last:border-0 hover:bg-ink-700/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-cream-400/20 bg-ink-700" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-cream-50">{s.nombre}</div>
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="truncate text-[11px] text-gold/80 hover:underline">
                          {s.email}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-widest ${
                      s.active ? 'border-gold/50 bg-gold/10 text-gold' : 'border-cream-400/20 text-cream-200/60'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.active ? 'bg-gold' : 'bg-cream-400/50'}`} />
                    {s.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-cream-100/90">{antiguedad(s.diasSuscripto)}</td>
                <td className="px-4 py-3 text-cream-200/70">{fecha(s.activatedAt)}</td>
                <td className="px-4 py-3 text-cream-200/70">{fecha(s.registradoAt)}</td>
                <td className="px-4 py-3 text-cream-200/70">{fecha(s.ultimoIngresoAt)}</td>
                <td className="px-4 py-3 text-cream-200/60">{s.lastEvent ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
