import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { kv, KV_ACTIVE, kvSource } from '@/lib/kv'
import { brand } from '@/lib/config/brand'
import { formatDate } from '@/lib/utils'

export const metadata = { title: `Panel · ${brand.name}` }
export const dynamic = 'force-dynamic'

type Sub = {
  active: boolean
  preapprovalId?: string
  activatedAt?: string
  cancelledAt?: string
  lastEvent?: string
}

async function loadStats() {
  if (!kv) return { total: 0, active: 0, subs: [] as Sub[], keys: [] as string[], error: true }
  try {
    const keys = await kv.keys('sub:*')
    const values = await Promise.all(keys.map((k) => kv!.get<Sub>(k)))
    const subs = values.filter(Boolean) as Sub[]
    const active = subs.filter((s) => s.active).length
    return { total: subs.length, active, subs, keys }
  } catch {
    return { total: 0, active: 0, subs: [] as Sub[], keys: [] as string[], error: true }
  }
}

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

  const [stats, contact] = await Promise.all([loadStats(), loadContact()])

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

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatBox label="Total registrados con actividad" value={stats.total} />
          <StatBox label="Suscriptores activos" value={stats.active} accent />
          <StatBox label="Mensajes recibidos" value={contact.length} />
        </div>

        <div className="mt-12">
          <h2 className="title-display text-2xl">Suscripciones</h2>
          <div className="mt-4 overflow-x-auto rounded-sm border border-cream-400/10 bg-ink-800/60">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-widest text-cream-400/70">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Preapproval</th>
                  <th className="p-3">Activada</th>
                  <th className="p-3">Cancelada</th>
                  <th className="p-3">Último evento</th>
                </tr>
              </thead>
              <tbody className="text-cream-100/90">
                {stats.keys.map((k, i) => {
                  const s = stats.subs[i]
                  if (!s) return null
                  const uid = k.replace(/^sub:/, '')
                  return (
                    <tr key={k} className="border-t border-cream-400/10">
                      <td className="p-3 font-mono text-[10px]">{uid}</td>
                      <td className="p-3">{s.active ? <span className="text-gold">Activa</span> : <span className="text-cream-400/70">Inactiva</span>}</td>
                      <td className="p-3 font-mono text-[10px]">{s.preapprovalId ?? '—'}</td>
                      <td className="p-3">{s.activatedAt ? formatDate(s.activatedAt) : '—'}</td>
                      <td className="p-3">{s.cancelledAt ? formatDate(s.cancelledAt) : '—'}</td>
                      <td className="p-3">{s.lastEvent ?? '—'}</td>
                    </tr>
                  )
                })}
                {stats.keys.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-cream-400/70">Todavía no hay suscripciones registradas.</td></tr>
                )}
              </tbody>
            </table>
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

function StatBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`border p-6 text-center ${accent ? 'border-gold/60 bg-gold/5' : 'border-cream-400/10 bg-ink-800/60'}`}>
      <div className="font-serif text-4xl text-cream-50">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-cream-400/70">{label}</div>
    </div>
  )
}
