'use client'

import { useState } from 'react'
import { Check, ChevronDown, Eye, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { CampoImagen } from './CampoImagen'

export type ProductoEditable = {
  slug: string
  nombre: string
  categoria: string
  resumen: string
  precio: number
  imagen: string | null
  descripcion: string[]
  variantes: { titulo: string; opciones: string[] } | null
  detalles: string[]
  estado: 'disponible' | 'agotado'
  creadoEnPanel?: boolean
}

const campo =
  'w-full rounded-sm border border-cream-400/15 bg-ink-900/70 px-3 py-2 text-sm text-cream-100 placeholder:text-cream-400/40 focus:border-gold focus:outline-none'
const rotulo = 'mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-cream-400/70'

export function ProductosEditor({
  productos,
  editados,
  ocultos,
  blobActivo,
  activo,
}: {
  productos: ProductoEditable[]
  editados: string[]
  ocultos: string[]
  blobActivo: boolean
  activo: boolean
}) {
  const [lista, setLista] = useState(productos)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [borrador, setBorrador] = useState<ProductoEditable | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [conEdicion, setConEdicion] = useState<string[]>(editados)

  const abrir = (p: ProductoEditable) => {
    if (abierto === p.slug) {
      setAbierto(null)
      setBorrador(null)
      return
    }
    setAbierto(p.slug)
    // Se edita sobre una copia: hasta apretar Guardar nada toca la tienda.
    setBorrador(JSON.parse(JSON.stringify(p)))
    setAviso('')
  }

  const set = <K extends keyof ProductoEditable>(k: K, v: ProductoEditable[K]) => {
    setBorrador((b) => (b ? { ...b, [k]: v } : b))
    setAviso('')
  }

  const pedir = async (cuerpo: any) => {
    const res = await fetch('/api/admin/tienda', {
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
        nombre: borrador.nombre,
        categoria: borrador.categoria,
        resumen: borrador.resumen,
        precio: Number(borrador.precio) || 0,
        imagen: borrador.imagen ?? '',
        descripcion: borrador.descripcion.filter((t) => t.trim()),
        // Sin opciones cargadas no es una variante: se guarda null para que la
        // ficha no dibuje un bloque de talles vacío.
        variantes:
          borrador.variantes && borrador.variantes.opciones.filter((o) => o.trim()).length
            ? {
                titulo: borrador.variantes.titulo || 'Talle',
                opciones: borrador.variantes.opciones.filter((o) => o.trim()),
              }
            : '',
        detalles: borrador.detalles.filter((d) => d.trim()),
        estado: borrador.estado,
      },
    })
    setGuardando(false)
    if (!ok) {
      setAviso(json?.detalle ?? json?.error ?? 'No se pudo guardar')
      return
    }
    setLista((l) => l.map((p) => (p.slug === borrador.slug ? borrador : p)))
    setConEdicion((c) => (c.includes(borrador.slug) ? c : [...c, borrador.slug]))
    setAviso('Guardado')
  }

  const crear = async () => {
    const nombre = nuevoNombre.trim()
    if (nombre.length < 2) return
    setCreando(true)
    const { ok, json } = await pedir({ accion: 'crear', nombre })
    setCreando(false)
    if (!ok) {
      setAviso(json?.error ?? 'No se pudo crear')
      return
    }
    setNuevoNombre('')
    location.reload()
  }

  const accion = async (slug: string, acc: 'borrar' | 'mostrar' | 'restaurar') => {
    const textos: Record<string, string> = {
      borrar: '¿Sacar este producto de la tienda?',
      mostrar: '',
      restaurar: '¿Descartar todo lo editado y volver al original?',
    }
    if (textos[acc] && !confirm(textos[acc])) return
    const { ok, json } = await pedir({ accion: acc, slug })
    if (!ok) {
      setAviso(
        json?.error === 'sin-original'
          ? 'Este producto se creó en el panel: no tiene original al que volver.'
          : (json?.error ?? 'No se pudo completar'),
      )
      return
    }
    location.reload()
  }

  if (!activo) {
    return (
      <p className="rounded-sm border border-red-400/50 bg-red-400/5 px-3 py-2 text-xs text-red-300">
        La base no está conectada: no se pueden crear ni editar productos.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 border border-cream-400/10 bg-ink-800/40 p-4">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nombre del producto nuevo"
          className={`${campo} max-w-xs`}
        />
        <button
          onClick={crear}
          disabled={nuevoNombre.trim().length < 2 || creando}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cream-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          {creando ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Crear
        </button>
        <span className="text-[11px] text-cream-400/60">
          Nace agotado. Se pone disponible cuando esté completo.
        </span>
      </div>

      <div className="space-y-2">
        {lista.map((p) => {
          const estaAbierto = abierto === p.slug
          const oculto = ocultos.includes(p.slug)
          const b = estaAbierto ? borrador : null

          return (
            <div key={p.slug} className="border border-cream-400/10 bg-ink-800/40">
              <button
                onClick={() => abrir(p)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-800/70"
              >
                {conEdicion.includes(p.slug) && (
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
                  {p.nombre}
                </span>
                <span className="text-[11px] text-cream-400/70">
                  ${Number(p.precio).toLocaleString('es-AR')}
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] ${
                    p.estado === 'disponible'
                      ? 'border-gold/40 text-gold'
                      : 'border-cream-400/20 text-cream-400/70'
                  }`}
                >
                  {p.estado}
                </span>
                {p.creadoEnPanel && (
                  <span className="rounded-sm border border-cream-400/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-cream-400/70">
                    del panel
                  </span>
                )}
                {oculto && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-red-300/80">
                    fuera de la tienda
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
                      <label className={rotulo}>Nombre</label>
                      <input
                        value={b.nombre}
                        onChange={(e) => set('nombre', e.target.value)}
                        className={campo}
                      />
                    </div>
                    <div>
                      <label className={rotulo}>Categoría</label>
                      <input
                        value={b.categoria}
                        onChange={(e) => set('categoria', e.target.value)}
                        placeholder="Indumentaria, Objetos…"
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

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={rotulo}>Precio (pesos, sin centavos)</label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={b.precio}
                        onChange={(e) => set('precio', Number(e.target.value))}
                        className={campo}
                      />
                    </div>
                    <div>
                      <label className={rotulo}>Estado</label>
                      <select
                        value={b.estado}
                        onChange={(e) => set('estado', e.target.value as ProductoEditable['estado'])}
                        className={campo}
                      >
                        <option value="disponible">Disponible</option>
                        <option value="agotado">Agotado</option>
                      </select>
                    </div>
                  </div>

                  <CampoImagen
                    etiqueta="Foto"
                    valor={b.imagen ?? ''}
                    onCambio={(url) => set('imagen', url)}
                    carpeta="tienda"
                    blobActivo={blobActivo}
                    ayuda="Sin foto se muestra una pieza de marca en su lugar."
                  />

                  <ListaTextos
                    titulo="Descripción"
                    ayuda="Un renglón por párrafo."
                    items={b.descripcion}
                    onCambio={(v) => set('descripcion', v)}
                    multilinea
                  />

                  <div>
                    <label className={rotulo}>
                      Variantes
                      <span className="ml-2 normal-case tracking-normal text-cream-400/50">
                        Talles, colores. Vacío si el producto es uno solo.
                      </span>
                    </label>
                    <div className="space-y-2">
                      <input
                        value={b.variantes?.titulo ?? ''}
                        onChange={(e) =>
                          set('variantes', {
                            titulo: e.target.value,
                            opciones: b.variantes?.opciones ?? [],
                          })
                        }
                        placeholder="Cómo se llama (Talle, Color…)"
                        className={campo}
                      />
                      <input
                        value={(b.variantes?.opciones ?? []).join(', ')}
                        onChange={(e) =>
                          set('variantes', {
                            titulo: b.variantes?.titulo ?? 'Talle',
                            opciones: e.target.value.split(',').map((o) => o.trim()),
                          })
                        }
                        placeholder="Opciones separadas por coma: S, M, L, XL"
                        className={campo}
                      />
                    </div>
                  </div>

                  <ListaTextos
                    titulo="Detalles"
                    items={b.detalles}
                    onCambio={(v) => set('detalles', v)}
                  />

                  <div className="flex flex-wrap items-center gap-2 border-t border-cream-400/10 pt-4">
                    <button
                      onClick={guardar}
                      disabled={guardando}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cream-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-900 transition hover:bg-white disabled:opacity-40"
                    >
                      {guardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Guardar
                    </button>

                    <a
                      href={`/tienda/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-cream-400/70 transition hover:text-gold"
                    >
                      <Eye size={12} /> Ver
                    </a>

                    {!p.creadoEnPanel && (
                      <button
                        onClick={() => accion(p.slug, 'restaurar')}
                        className="inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-cream-400/70 transition hover:text-gold"
                      >
                        <RotateCcw size={12} /> Volver al original
                      </button>
                    )}

                    {oculto ? (
                      <button
                        onClick={() => accion(p.slug, 'mostrar')}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-gold/50 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-gold transition hover:bg-gold/10"
                      >
                        Volver a mostrar
                      </button>
                    ) : (
                      <button
                        onClick={() => accion(p.slug, 'borrar')}
                        className="ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-red-300/80 transition hover:text-red-300"
                      >
                        <Trash2 size={12} /> {p.creadoEnPanel ? 'Borrar' : 'Sacar de la tienda'}
                      </button>
                    )}

                    {aviso && (
                      <span className={`text-xs ${aviso === 'Guardado' ? 'text-gold' : 'text-red-300'}`}>
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

/** Lista de renglones sueltos: párrafos o detalles. */
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
