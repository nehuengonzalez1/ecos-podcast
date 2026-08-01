import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { kv, KV_ACTIVE, kvSource } from '@/lib/kv'
import { brand } from '@/lib/config/brand'
import { cargarSuscriptores, calcularMetricas } from '@/lib/admin-data'
import { statsPorEpisodio, totalesPorAccion, ACCIONES } from '@/lib/analytics'
import data from '@/data/episodes.json'
import { SuscriptoresTabla } from './SuscriptoresTabla'
import { ResyncButton } from './ResyncButton'
import { Evolucion } from './Evolucion'

export const metadata = { title: `Panel · ${brand.name}` }
export const dynamic = 'force-dynamic'

async function loadContact() {
  if (!kv) return []
  try {
    const items = await kv.lrange('contact:inbox', 0, 49)
    return items.map((raw) => {
      try { return JSON.parse(raw as string) } catch { return null }
    }).filter(Boolean) as any[]
  } catch {
    return []
  }
}

export default async function AdminPage() {
  const ok = await isAdmin()
  if (!ok) redirect('/')

  const [subs, contact, porEpisodio, totales] = await Promise.all([
    cargarSuscriptores(),
    loadContact(),
    statsPorEpisodio(),
    totalesPorAccion(),
  ])
  const m = await calcularMetricas(subs)
  const nombreEpisodio = (slug: string) =>
    data.episodes.find((e) => e.slug === slug)?.guest ?? slug

  return (
    <section className="spotlight-bg pt-32 pb-24 min-h-[80vh]">
      <div className="container-page">
        <p className="eyebrow mb-4">Admin</p>
        <h1 className="title-display text-5xl">Panel {brand.name}</h1>

        {/* Sin esto, un Redis mal conectado se ve igual que "todavia no hay
            datos": los contadores muestran 0 y nada avisa del problema. */}
        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs ${
            KV_ACTIVE
              ? 'border-gold/40 bg-gold/5 text-cream-200/90'
              : 'border-red-400/50 bg-red-400/5 text-red-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${KV_ACTIVE ? 'bg-gold' : 'bg-red-400'}`} />
          {KV_ACTIVE ? (
            <>Base de datos conectada · variables <code>{kvSource()}</code></>
          ) : (
            <>Base de datos NO conectada — las suscripciones y los mensajes no se están guardando</>
          )}
        </div>

        <div className="mt-6">
          <ResyncButton />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox label="Suscriptores activos" value={m.activos} accent />
          <StatBox
            label="Ingreso mensual"
            value={`$${m.ingresoMensual.toLocaleString('es-AR')}`}
            hint={`${m.activos} × $${m.precio.toLocaleString('es-AR')}`}
          />
          <StatBox
            label="Antigüedad promedio"
            value={m.antiguedadPromedio === null ? '—' : `${m.antiguedadPromedio} d`}
            hint="de los activos"
          />
          <StatBox label="Mensajes recibidos" value={contact.length} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatBox label="Altas · últimos 30 días" value={m.altasUltimos30} />
          <StatBox label="Bajas · últimos 30 días" value={m.bajasUltimos30} />
          <StatBox label="Cancelados históricos" value={m.cancelados} />
        </div>

        {m.eventos.length === 0 && (
          <p className="mt-4 text-[11px] text-cream-400/70">
            El registro de eventos empezó recién: las altas y bajas anteriores a este cambio no
            quedaron guardadas y no se pueden reconstruir. De acá en adelante sí.
          </p>
        )}

        <div className="mt-12">
          <h2 className="title-display text-2xl">Evolución</h2>
          <div className="mt-4">
            <Evolucion eventos={m.eventos} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="title-display text-2xl">Qué consumen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ACCIONES.map((a) => (
              <StatBox key={a} label={a === 'episodio' ? 'Vistas de episodio' : a} value={totales[a]} />
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-sm border border-cream-400/10 bg-ink-800/60">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-cream-400/70">
                <tr className="border-b border-cream-400/10">
                  <th className="px-4 py-3">Episodio</th>
                  {ACCIONES.map((a) => (
                    <th key={a} className="px-4 py-3">{a === 'episodio' ? 'Vistas' : a}</th>
                  ))}
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {porEpisodio.length === 0 && (
                  <tr>
                    <td colSpan={ACCIONES.length + 2} className="px-4 py-8 text-center text-cream-400/70">
                      Todavía no hay actividad registrada. Se empieza a medir desde este cambio.
                    </td>
                  </tr>
                )}
                {porEpisodio.map((e) => (
                  <tr key={e.slug} className="border-b border-cream-400/5 last:border-0 hover:bg-ink-700/40">
                    <td className="px-4 py-3 font-medium text-cream-50">{nombreEpisodio(e.slug)}</td>
                    {ACCIONES.map((a) => (
                      <td key={a} className="px-4 py-3 text-cream-200/70">{e.porAccion[a] || '—'}</td>
                    ))}
                    <td className="px-4 py-3 text-gold">{e.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="title-display text-2xl">Suscriptores</h2>
          <div className="mt-4">
            <SuscriptoresTabla subs={subs} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="title-display text-2xl">Últimos mensajes (Contá tu historia)</h2>
          <div className="mt-4 space-y-4">
            {contact.length === 0 && (
              <p className="text-sm text-cream-400/70">Sin mensajes por ahora.</p>
            )}
            {contact.map((c, i) => (
              <div key={i} className="card-panel">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-serif text-lg text-cream-50">{c.nombre}</div>
                    <a href={`mailto:${c.email}`} className="text-xs text-gold hover:underline">{c.email}</a>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-cream-400/70">
                    {c.at ? new Date(c.at).toLocaleString('es-AR') : ''}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream-200/80">
                  {c.ubicacion && <span>{c.ubicacion}</span>}
                  {c.instagram && <span>{c.instagram}</span>}
                  {c.origen && <span>Llegó por: {c.origen}</span>}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-cream-100/90">{c.historia}</p>
                {c.motivo && (
                  <>
                    <div className="eyebrow mt-4 mb-1">Por qué quiere contarla</div>
                    <p className="whitespace-pre-wrap text-sm text-cream-100/80">{c.motivo}</p>
                  </>
                )}
                {c.notas && (
                  <>
                    <div className="eyebrow mt-4 mb-1">A tener en cuenta</div>
                    <p className="whitespace-pre-wrap text-sm text-cream-100/80">{c.notas}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatBox({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: number | string
  accent?: boolean
  hint?: string
}) {
  return (
    <div className={`border p-6 text-center ${accent ? 'border-gold/60 bg-gold/5' : 'border-cream-400/10 bg-ink-800/60'}`}>
      <div className="font-serif text-4xl text-cream-50">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-cream-400/70">{label}</div>
      {hint && <div className="mt-1 text-[10px] text-cream-400/50">{hint}</div>}
    </div>
  )
}
