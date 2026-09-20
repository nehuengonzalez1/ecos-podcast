'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Download,
  ExternalLink,
  Loader2,
  Trophy,
  Users,
} from 'lucide-react'
import type { EstadoSorteo } from '@/lib/sorteos'

type Participacion = {
  id: string
  nombre: string
  email: string
  instagram?: string
  ciudad: string
  at: string
}

export type FilaSorteo = {
  slug: string
  titulo: string
  categoria: string
  estado: EstadoSorteo
  cierra: string
  anotados: number
}

type Detalle = {
  participantes: Participacion[]
  ganador: Participacion | null
  tiradas: number
  ultimaTirada: string | null
}

const ETIQUETA: Record<EstadoSorteo, string> = {
  activo: 'Activo',
  proximo: 'Próximo',
  finalizado: 'Cerrado',
}

const COLOR: Record<EstadoSorteo, string> = {
  activo: 'border-gold/50 bg-gold/10 text-gold',
  proximo: 'border-cream-400/25 text-cream-200/70',
  finalizado: 'border-cream-400/20 text-cream-400/70',
}

function fecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d)
}

export function SorteosPanel({ filas, activo }: { filas: FilaSorteo[]; activo: boolean }) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const [detalles, setDetalles] = useState<Record<string, Detalle>>({})
  const [cargando, setCargando] = useState<string | null>(null)
  const [sorteando, setSorteando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ slug: string; texto: string } | null>(null)

  const abrir = async (slug: string) => {
    if (abierto === slug) {
      setAbierto(null)
      return
    }
    setAbierto(slug)
    setAviso(null)

    // Se pide una sola vez por sorteo. Volver a abrirlo usa lo ya traído, que
    // para una lista de anotados es suficiente: no cambia mientras se mira.
    if (detalles[slug]) return

    setCargando(slug)
    try {
      const res = await fetch(`/api/admin/sorteos?slug=${encodeURIComponent(slug)}`)
      const json = await res.json()
      if (!res.ok) {
        setAviso({ slug, texto: json?.error ?? 'No se pudieron cargar los anotados.' })
        return
      }
      setDetalles((d) => ({ ...d, [slug]: json }))
    } catch {
      setAviso({ slug, texto: 'No se pudieron cargar los anotados. Revisá la conexión.' })
    } finally {
      setCargando(null)
    }
  }

  const tirar = async (slug: string, yaHay: boolean) => {
    if (yaHay && !confirm('Ya hay un ganador. ¿Sortear de nuevo? Queda registrado que se sorteó otra vez.')) {
      return
    }
    setSorteando(slug)
    setAviso(null)
    try {
      const res = await fetch('/api/admin/sorteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'sortear', slug }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAviso({ slug, texto: mensajeDeError(json?.error) })
        return
      }
      setDetalles((d) => ({
        ...d,
        [slug]: { ...d[slug], ganador: json.ganador, tiradas: json.tiradas, ultimaTirada: new Date().toISOString() },
      }))
    } catch {
      setAviso({ slug, texto: 'No se pudo sortear. Revisá la conexión.' })
    } finally {
      setSorteando(null)
    }
  }

  const bajarCsv = (fila: FilaSorteo, lista: Participacion[]) => {
    const filasCsv = [
      ['Nombre', 'Email', 'Instagram', 'Provincia', 'Fecha'],
      ...lista.map((p) => [p.nombre, p.email, p.instagram ?? '', p.ciudad, fecha(p.at)]),
    ]
    // Comillas dobles en todo y las internas duplicadas: un nombre con una
    // coma partiría la fila en dos columnas, y Excel abriría cualquier cosa.
    const texto = filasCsv
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    // BOM al principio: sin él, Excel en Windows abre el archivo como ANSI y
    // los acentos salen rotos.
    const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anotados-${fila.slug}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!activo) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-red-400/50 bg-red-400/5 px-3 py-2 text-xs text-red-300">
        <AlertTriangle size={14} />
        La base no está conectada: no se pueden ver los anotados ni sortear.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filas.map((f) => {
        const d = detalles[f.slug]
        const estaAbierto = abierto === f.slug
        const puedeSortear = f.estado === 'finalizado' && f.anotados > 0

        return (
          <div key={f.slug} className="border border-cream-400/10 bg-ink-800/40">
            <button
              onClick={() => abrir(f.slug)}
              className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left transition hover:bg-ink-800/70"
            >
              <span
                className={`rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${COLOR[f.estado]}`}
              >
                {ETIQUETA[f.estado]}
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.1em] text-cream-50">
                {f.titulo}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-cream-400/70">
                <Users size={12} />
                {f.anotados} {f.anotados === 1 ? 'anotado' : 'anotados'}
              </span>
              <span className="text-[11px] text-cream-400/60">cierra {fecha(f.cierra)}</span>
              <ChevronDown
                size={15}
                className={`ml-auto shrink-0 text-cream-400/60 transition ${estaAbierto ? 'rotate-180' : ''}`}
              />
            </button>

            {estaAbierto && (
              <div className="border-t border-cream-400/10 px-4 py-4">
                {cargando === f.slug ? (
                  <p className="flex items-center gap-2 text-xs text-cream-200/60">
                    <Loader2 size={13} className="animate-spin" /> Cargando anotados…
                  </p>
                ) : (
                  <>
                    {aviso?.slug === f.slug && (
                      <p className="mb-3 text-xs text-red-300">{aviso.texto}</p>
                    )}

                    {d?.ganador && (
                      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-gold/40 bg-gold/5 px-3 py-2.5">
                        <Trophy size={15} className="shrink-0 text-gold" />
                        <div className="text-xs">
                          <p className="font-semibold uppercase tracking-[0.15em] text-gold">
                            {d.ganador.nombre}
                          </p>
                          <p className="mt-0.5 text-cream-200/75">
                            {d.ganador.email}
                            {d.ganador.instagram && ` · @${d.ganador.instagram}`} · {d.ganador.ciudad}
                          </p>
                        </div>
                        {d.tiradas > 1 && (
                          <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-cream-400/70">
                            se sorteó {d.tiradas} veces
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => tirar(f.slug, !!d?.ganador)}
                        disabled={!puedeSortear || sorteando === f.slug}
                        title={
                          f.estado !== 'finalizado'
                            ? 'Se puede sortear recién cuando cierre el plazo'
                            : f.anotados === 0
                              ? 'Todavía no se anotó nadie'
                              : undefined
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cream-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {sorteando === f.slug ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Sorteando…
                          </>
                        ) : (
                          <>
                            <Trophy size={12} /> {d?.ganador ? 'Sortear de nuevo' : 'Sortear'}
                          </>
                        )}
                      </button>

                      {!!d?.participantes.length && (
                        <button
                          onClick={() => bajarCsv(f, d.participantes)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-cream-400/25 px-3.5 py-2 text-[10px] uppercase tracking-[0.15em] text-cream-200/80 transition hover:border-gold/50 hover:text-gold"
                        >
                          <Download size={12} /> Bajar CSV
                        </button>
                      )}

                      <a
                        href={`/sorteos/${f.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-cream-400/70 transition hover:text-gold"
                      >
                        <ExternalLink size={12} /> Ver en el sitio
                      </a>

                      {f.estado !== 'finalizado' && (
                        <span className="text-[11px] text-cream-400/60">
                          Se puede sortear cuando cierre el plazo.
                        </span>
                      )}
                    </div>

                    {d && d.participantes.length === 0 ? (
                      <p className="text-xs text-cream-200/55">Todavía no se anotó nadie.</p>
                    ) : (
                      <div className="max-h-80 overflow-auto">
                        <table className="w-full min-w-[34rem] text-left text-xs">
                          <thead className="sticky top-0 bg-ink-800 text-[10px] uppercase tracking-[0.15em] text-cream-400/70">
                            <tr>
                              <th className="px-2 py-2 font-medium">Nombre</th>
                              <th className="px-2 py-2 font-medium">Email</th>
                              <th className="px-2 py-2 font-medium">Instagram</th>
                              <th className="px-2 py-2 font-medium">Provincia</th>
                              <th className="px-2 py-2 font-medium">Se anotó</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d?.participantes.map((p) => {
                              const gano = d.ganador?.id === p.id
                              return (
                                <tr
                                  key={p.id}
                                  className={`border-t border-cream-400/8 ${gano ? 'bg-gold/5 text-gold' : 'text-cream-200/80'}`}
                                >
                                  <td className="px-2 py-2">
                                    {gano && <Trophy size={10} className="mr-1 inline" />}
                                    {p.nombre}
                                  </td>
                                  <td className="px-2 py-2">{p.email}</td>
                                  <td className="px-2 py-2">{p.instagram ? `@${p.instagram}` : '—'}</td>
                                  <td className="px-2 py-2">{p.ciudad}</td>
                                  <td className="px-2 py-2 whitespace-nowrap">{fecha(p.at)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function mensajeDeError(codigo?: string): string {
  if (codigo === 'todavia-abierto') {
    return 'El sorteo sigue abierto. Sortear ahora dejaría afuera a quien se anote después.'
  }
  if (codigo === 'sin-participantes') return 'No hay nadie anotado para sortear.'
  if (codigo === 'sin-base') return 'La base no está conectada.'
  return 'No se pudo sortear.'
}
