'use client'

import { useState } from 'react'
import {
  Check,
  ChevronDown,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { CampoImagen } from './CampoImagen'

/** Los íconos que sabe dibujar la ficha del sorteo, con nombre humano. */
const ICONOS = [
  { valor: 'regalo', texto: 'Regalo' },
  { valor: 'entrada', texto: 'Entrada' },
  { valor: 'camara', texto: 'Cámara' },
  { valor: 'cafe', texto: 'Café' },
  { valor: 'foto', texto: 'Foto' },
  { valor: 'envio', texto: 'Envío' },
]

export type SorteoEditable = {
  slug: string
  titulo: string
  categoria: string
  resumen: string
  imagen: string | null
  cierra: string
  abre?: string | null
  ganadores: number
  lugar: string
  descripcion: string[]
  nota?: string | null
  incluye: { icono: string; texto: string }[]
  condiciones: string[]
  /** Creado desde el panel: se puede borrar de verdad y no tiene original. */
  creadoEnPanel?: boolean
}

const campo =
  'w-full rounded-sm border border-cream-400/15 bg-ink-900/70 px-3 py-2 text-sm text-cream-100 placeholder:text-cream-400/40 focus:border-gold focus:outline-none'
const rotulo = 'mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-cream-400/70'

/**
 * Pasa un ISO con huso al formato que entiende <input type="datetime-local">.
 *
 * Se recorta el texto en vez de usar Date: convertir a Date y volver a
 * formatear reinterpretaría la fecha en el huso de quien mire el panel, así
 * que abrir el panel desde otro país correría la hora de cierre sin que nadie
 * la tocara.
 */
function aLocal(iso?: string | null): string {
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[1]}T${m[2]}` : ''
}

/**
 * Y de vuelta, fijando el huso de Argentina.
 *
 * El país no tiene horario de verano, así que -03:00 vale todo el año y no
 * hay que preguntarse en qué mes cae la fecha.
 */
function aIso(local: string): string {
  if (!local) return ''
  return `${local}:00-03:00`
}

export function SorteosEditor({
  sorteos,
  editados,
  ocultos,
  blobActivo,
  activo,
}: {
  sorteos: SorteoEditable[]
  /** Slugs con ediciones guardadas, para marcarlos. */
  editados: string[]
  ocultos: string[]
  blobActivo: boolean
  activo: boolean
}) {
  const [lista, setLista] = useState(sorteos)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [borrador, setBorrador] = useState<SorteoEditable | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [creando, setCreando] = useState(false)
  const [conEdicion, setConEdicion] = useState<string[]>(editados)
  const [escondidos, setEscondidos] = useState<string[]>(ocultos)

  const abrir = (s: SorteoEditable) => {
    if (abierto === s.slug) {
      setAbierto(null)
      setBorrador(null)
      return
    }
    setAbierto(s.slug)
    // Se edita sobre una copia: hasta apretar Guardar, nada de lo que se
    // escriba toca la lista ni el sitio.
    setBorrador(JSON.parse(JSON.stringify(s)))
    setAviso('')
  }

  const set = <K extends keyof SorteoEditable>(clave: K, valor: SorteoEditable[K]) => {
    setBorrador((b) => (b ? { ...b, [clave]: valor } : b))
    setAviso('')
  }

  const pedir = async (cuerpo: any) => {
    const res = await fetch('/api/admin/sorteos/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, json }
  }

  const guardar = async () => {
    if (!borrador) return
    setGuardando(true)
    setAviso('')
    const { ok, json } = await pedir({
      slug: borrador.slug,
      campos: {
        titulo: borrador.titulo,
        categoria: borrador.categoria,
        resumen: borrador.resumen,
        imagen: borrador.imagen ?? '',
        cierra: borrador.cierra,
        abre: borrador.abre ?? '',
        ganadores: Number(borrador.ganadores) || 1,
        lugar: borrador.lugar,
        descripcion: borrador.descripcion.filter((p) => p.trim()),
        nota: borrador.nota ?? '',
        incluye: borrador.incluye.filter((i) => i.texto.trim()),
        condiciones: borrador.condiciones.filter((c) => c.trim()),
      },
    })
    setGuardando(false)

    if (!ok) {
      setAviso(json?.detalle ?? json?.error ?? 'No se pudo guardar')
      return
    }
    setLista((l) => l.map((s) => (s.slug === borrador.slug ? borrador : s)))
    setConEdicion((c) => (c.includes(borrador.slug) ? c : [...c, borrador.slug]))
    setAviso('Guardado')
  }

  const crear = async () => {
    const titulo = nuevoTitulo.trim()
    if (titulo.length < 2) return
    setCreando(true)
    const { ok, json } = await pedir({ accion: 'crear', titulo })
    setCreando(false)
    if (!ok) {
      setAviso(json?.error ?? 'No se pudo crear')
      return
    }
    setNuevoTitulo('')
    // Se recarga para traer el sorteo nuevo tal como quedó en la base, en vez
    // de adivinar acá qué valores le puso el servidor.
    location.reload()
  }

  const accion = async (slug: string, accion: 'borrar' | 'mostrar' | 'restaurar') => {
    const textos = {
      borrar: '¿Sacar este sorteo del sitio? Los anotados no se borran.',
      mostrar: '',
      restaurar: '¿Descartar todo lo editado y volver al original?',
    }
    if (textos[accion] && !confirm(textos[accion])) return

    const { ok, json } = await pedir({ accion, slug })
    if (!ok) {
      setAviso(
        json?.error === 'sin-original'
          ? 'Este sorteo se creó en el panel: no tiene original al que volver.'
          : (json?.error ?? 'No se pudo completar'),
      )
      return
    }
    location.reload()
  }

  if (!activo) {
    return (
      <p className="rounded-sm border border-red-400/50 bg-red-400/5 px-3 py-2 text-xs text-red-300">
        La base no está conectada: no se pueden crear ni editar sorteos.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 border border-cream-400/10 bg-ink-800/40 p-4">
        <input
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          placeholder="Título del sorteo nuevo"
          className={`${campo} max-w-xs`}
        />
        <button
          onClick={crear}
          disabled={nuevoTitulo.trim().length < 2 || creando}
          className="inline-flex items-center gap-1.5 rounded-sm bg-cream-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          {creando ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Crear
        </button>
        <span className="text-[11px] text-cream-400/60">
          Nace cerrado. Se abre poniéndole una fecha de cierre futura cuando esté listo.
        </span>
      </div>

      <div className="space-y-2">
        {lista.map((s) => {
          const estaAbierto = abierto === s.slug
          const oculto = escondidos.includes(s.slug)
          const b = estaAbierto ? borrador : null

          return (
            <div key={s.slug} className="border border-cream-400/10 bg-ink-800/40">
              <button
                onClick={() => abrir(s)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-800/70"
              >
                {conEdicion.includes(s.slug) && (
                  <span
                    title="Tiene ediciones guardadas"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  />
                )}
                <span
                  className={`text-sm font-semibold uppercase tracking-[0.1em] ${
                    oculto ? 'text-cream-400/50 line-through' : 'text-cream-50'
                  }`}
                >
                  {s.titulo}
                </span>
                {s.creadoEnPanel && (
                  <span className="rounded-sm border border-cream-400/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-cream-400/70">
                    del panel
                  </span>
                )}
                {oculto && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-red-300/80">
                    fuera del sitio
                  </span>
                )}
                <ChevronDown
                  size={15}
                  className={`ml-auto shrink-0 text-cream-400/60 transition ${estaAbierto ? 'rotate-180' : ''}`}
                />
              </button>

              {estaAbierto && b && (
                <div className="space-y-4 border-t border-cream-400/10 px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={rotulo}>Título</label>
                      <input
                        value={b.titulo}
                        onChange={(e) => set('titulo', e.target.value)}
                        className={campo}
                      />
                    </div>
                    <div>
                      <label className={rotulo}>Categoría</label>
                      <input
                        value={b.categoria}
                        onChange={(e) => set('categoria', e.target.value)}
                        placeholder="Productos, Experiencias…"
                        className={campo}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={rotulo}>Bajada corta (la de la tarjeta)</label>
                    <input
                      value={b.resumen}
                      onChange={(e) => set('resumen', e.target.value)}
                      className={campo}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={rotulo}>Cierra</label>
                      <input
                        type="datetime-local"
                        value={aLocal(b.cierra)}
                        onChange={(e) => set('cierra', aIso(e.target.value))}
                        className={campo}
                      />
                    </div>
                    <div>
                      <label className={rotulo}>Abre (opcional)</label>
                      <input
                        type="datetime-local"
                        value={aLocal(b.abre)}
                        onChange={(e) => set('abre', e.target.value ? aIso(e.target.value) : '')}
                        className={campo}
                      />
                    </div>
                    <div>
                      <label className={rotulo}>Ganadores</label>
                      <input
                        type="number"
                        min={1}
                        value={b.ganadores}
                        onChange={(e) => set('ganadores', Number(e.target.value))}
                        className={campo}
                      />
                    </div>
                  </div>
                  <p className="-mt-2 text-[11px] text-cream-400/60">
                    Las horas son de Argentina. Sin fecha de apertura el sorteo ya está abierto;
                    con una futura figura como «Próximamente».
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={rotulo}>Lugar</label>
                      <input
                        value={b.lugar}
                        onChange={(e) => set('lugar', e.target.value)}
                        className={campo}
                      />
                    </div>
                    <div>
                      <label className={rotulo}>Nota manuscrita (opcional)</label>
                      <input
                        value={b.nota ?? ''}
                        onChange={(e) => set('nota', e.target.value)}
                        className={campo}
                      />
                    </div>
                  </div>

                  <CampoImagen
                    etiqueta="Portada"
                    valor={b.imagen ?? ''}
                    onCambio={(url) => set('imagen', url)}
                    carpeta="sorteos"
                    blobActivo={blobActivo}
                    ayuda="Sin imagen se muestra una pieza de marca en su lugar."
                  />

                  <ListaTextos
                    titulo="Sobre el sorteo"
                    ayuda="Un renglón por párrafo."
                    items={b.descripcion}
                    onCambio={(v) => set('descripcion', v)}
                    multilinea
                  />

                  <div>
                    <label className={rotulo}>¿Qué incluye?</label>
                    <div className="space-y-2">
                      {b.incluye.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <select
                            value={item.icono}
                            onChange={(e) => {
                              const v = [...b.incluye]
                              v[i] = { ...v[i], icono: e.target.value }
                              set('incluye', v)
                            }}
                            className={`${campo} w-32 shrink-0`}
                          >
                            {ICONOS.map((ic) => (
                              <option key={ic.valor} value={ic.valor}>
                                {ic.texto}
                              </option>
                            ))}
                          </select>
                          <input
                            value={item.texto}
                            onChange={(e) => {
                              const v = [...b.incluye]
                              v[i] = { ...v[i], texto: e.target.value }
                              set('incluye', v)
                            }}
                            className={campo}
                          />
                          <button
                            onClick={() => set('incluye', b.incluye.filter((_, j) => j !== i))}
                            aria-label="Quitar"
                            className="px-1 text-cream-400/50 transition hover:text-red-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => set('incluye', [...b.incluye, { icono: 'regalo', texto: '' }])}
                        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:text-gold"
                      >
                        <Plus size={12} /> Agregar
                      </button>
                    </div>
                  </div>

                  <ListaTextos
                    titulo="Condiciones"
                    items={b.condiciones}
                    onCambio={(v) => set('condiciones', v)}
                  />

                  <div className="flex flex-wrap items-center gap-2 border-t border-cream-400/10 pt-4">
                    <button
                      onClick={guardar}
                      disabled={guardando}
                      className="inline-flex items-center gap-1.5 rounded-sm bg-cream-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-900 transition hover:bg-white disabled:opacity-40"
                    >
                      {guardando ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Guardar
                    </button>

                    <a
                      href={`/sorteos/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-cream-400/70 transition hover:text-gold"
                    >
                      <Eye size={12} /> Ver
                    </a>

                    {!s.creadoEnPanel && (
                      <button
                        onClick={() => accion(s.slug, 'restaurar')}
                        className="inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-cream-400/70 transition hover:text-gold"
                      >
                        <RotateCcw size={12} /> Volver al original
                      </button>
                    )}

                    {oculto ? (
                      <button
                        onClick={() => accion(s.slug, 'mostrar')}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-sm border border-gold/50 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-gold transition hover:bg-gold/10"
                      >
                        Volver a mostrar
                      </button>
                    ) : (
                      <button
                        onClick={() => accion(s.slug, 'borrar')}
                        className="ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-red-300/80 transition hover:text-red-300"
                      >
                        <Trash2 size={12} /> {s.creadoEnPanel ? 'Borrar' : 'Sacar del sitio'}
                      </button>
                    )}

                    {aviso && (
                      <span
                        className={`text-xs ${aviso === 'Guardado' ? 'text-gold' : 'text-red-300'}`}
                      >
                        {aviso}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Lista de renglones sueltos: párrafos o condiciones. */
function ListaTextos({
  titulo,
  ayuda,
  items,
  onCambio,
  multilinea = false,
}: {
  titulo: string
  ayuda?: string
  items: string[]
  onCambio: (v: string[]) => void
  multilinea?: boolean
}) {
  return (
    <div>
      <label className={rotulo}>
        {titulo}
        {ayuda && <span className="ml-2 normal-case tracking-normal text-cream-400/50">{ayuda}</span>}
      </label>
      <div className="space-y-2">
        {items.map((t, i) => (
          <div key={i} className="flex gap-2">
            {multilinea ? (
              <textarea
                value={t}
                rows={2}
                onChange={(e) => onCambio(items.map((x, j) => (j === i ? e.target.value : x)))}
                className={campo}
              />
            ) : (
              <input
                value={t}
                onChange={(e) => onCambio(items.map((x, j) => (j === i ? e.target.value : x)))}
                className={campo}
              />
            )}
            <button
              onClick={() => onCambio(items.filter((_, j) => j !== i))}
              aria-label="Quitar"
              className="px-1 text-cream-400/50 transition hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={() => onCambio([...items, ''])}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:text-gold"
        >
          <Plus size={12} /> Agregar
        </button>
      </div>
    </div>
  )
}
