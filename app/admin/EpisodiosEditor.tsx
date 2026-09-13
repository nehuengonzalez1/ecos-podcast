'use client'

import { useMemo, useState } from 'react'
import { Check, Eye, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { CampoImagen } from './CampoImagen'

/**
 * Editor de contenido de los episodios.
 *
 * Lo que se guarda es solo lo que cambió respecto del archivo, no el episodio
 * entero (ver lib/contenido.ts). Por eso cada campo muestra un punto cuando
 * está editado: sin esa marca no habría forma de saber, mirando el panel, qué
 * viene del archivo y qué se escribió acá.
 *
 * Vaciar un campo no lo deja en blanco: lo devuelve a su valor del archivo.
 * Es lo que hace que se pueda deshacer una edición sin un botón aparte.
 */

/**
 * Los dos estados posibles de un capitulo, y lo unico que decide si se puede
 * ver o no.
 *
 * Las etiquetas son las mismas palabras que usa el sitio -- "Disponibles" y
 * "Proximamente" en el archivo, "Proximamente" en la tarjeta --, no sinonimos.
 * Antes el panel decia "Publicado" y "Muy pronto": obligaba a traducir
 * mentalmente entre lo que se elige aca y lo que despues aparece en pantalla.
 */
const ESTADOS = [
  { valor: 'available', texto: 'Disponible' },
  { valor: 'coming-soon', texto: 'Próximamente' },
]

type Props = {
  /** Los episodios tal cual están en el archivo, sin ediciones. */
  base: any[]
  /** Lo editado, por slug. */
  overrides: Record<string, any>
  blobActivo: boolean
  baseActiva: boolean
  /** Slugs que están fuera del sitio pero siguen visibles en el panel. */
  ocultos: string[]
}

export function EpisodiosEditor({ base, overrides, blobActivo, baseActiva, ocultos }: Props) {
  const [slugSel, setSlugSel] = useState(base[0]?.slug ?? '')
  const [ediciones, setEdiciones] = useState<Record<string, any>>(overrides)
  const [borrador, setBorrador] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const epBase = useMemo(() => base.find((e) => e.slug === slugSel), [base, slugSel])
  const escondidos = useMemo(() => new Set(ocultos), [ocultos])
  const oculto = escondidos.has(slugSel)
  const override = ediciones[slugSel] ?? {}

  // El borrador arranca como copia de lo editado y es lo que se toca en
  // pantalla; hasta que no se guarda, `ediciones` no cambia.
  const actual = borrador ?? override

  const valor = (campo: string) => actual[campo] ?? epBase?.[campo] ?? ''
  const valorAnidado = (padre: string, hijo: string) =>
    actual[padre]?.[hijo] ?? epBase?.[padre]?.[hijo] ?? ''
  const editado = (campo: string) => campo in actual

  const set = (campo: string, v: any) => setBorrador({ ...actual, [campo]: v })
  const setAnidado = (padre: string, hijo: string, v: any) =>
    setBorrador({ ...actual, [padre]: { ...(actual[padre] ?? {}), [hijo]: v } })

  const cambiarEpisodio = (slug: string) => {
    setSlugSel(slug)
    setBorrador(null)
    setAviso('')
  }

  const guardar = async () => {
    if (!borrador) return
    setGuardando(true)
    setAviso('')
    try {
      const res = await fetch('/api/admin/episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugSel, campos: borrador }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAviso(json?.detalle ?? json?.error ?? 'No se pudo guardar')
        return
      }
      setEdiciones({ ...ediciones, [slugSel]: json.override ?? {} })
      setBorrador(null)
      setAviso('Guardado')
    } catch {
      setAviso('No se pudo guardar. Revisá la conexión.')
    } finally {
      setGuardando(false)
    }
  }

  /**
   * Crea un episodio nuevo.
   *
   * El nombre es lo único que se pide: alcanza para armarle el slug y dejarlo
   * listo para completar. Nace como "muy pronto", así aparece en el archivo
   * como próximo capítulo pero su página no se abre hasta que lo publiques.
   *
   * Después de crearlo se recarga la página en vez de agregarlo a la lista en
   * memoria: el slug lo decide el servidor, y recargar es la forma más simple
   * de que la lista, las ediciones y el episodio abierto queden en el mismo
   * estado que la base.
   */
  const crear = async () => {
    const nombre = prompt('¿Cómo se llama la persona del episodio?')?.trim()
    if (!nombre) return

    setGuardando(true)
    setAviso('')
    try {
      const res = await fetch('/api/admin/episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'crear', nombre }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAviso(json?.detalle ?? json?.error ?? 'No se pudo crear')
        setGuardando(false)
        return
      }
      window.location.reload()
    } catch {
      setAviso('No se pudo crear. Revisá la conexión.')
      setGuardando(false)
    }
  }

  /** Vuelve a mostrar en el sitio un episodio que se había sacado. */
  const mostrar = async () => {
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugSel, accion: 'mostrar' }),
      })
      if (!res.ok) {
        setAviso('No se pudo recuperar')
        setGuardando(false)
        return
      }
      window.location.reload()
    } catch {
      setAviso('No se pudo recuperar. Revisá la conexión.')
      setGuardando(false)
    }
  }

  /**
   * Saca el episodio del sitio.
   *
   * Los creados en el panel se borran de verdad. Los que vienen del archivo
   * del proyecto no se pueden borrar, así que se ocultan: desaparecen del
   * sitio pero siguen en esta lista, apagados, para poder recuperarlos.
   */
  const borrar = async () => {
    const delArchivo = !epBase.creadoEnPanel
    const mensaje = delArchivo
      ? `¿Sacar "${valor('guest')}" del sitio? Vas a poder recuperarlo desde acá.`
      : `¿Borrar "${valor('guest')}"? Se va con todo lo que tenga cargado.`
    if (!confirm(mensaje)) return
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugSel, accion: 'borrar' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setAviso(json?.error ?? 'No se pudo borrar')
        setGuardando(false)
        return
      }
      window.location.reload()
    } catch {
      setAviso('No se pudo borrar. Revisá la conexión.')
      setGuardando(false)
    }
  }

  const restaurar = async () => {
    if (!confirm('¿Descartar todas las ediciones de este episodio y volver al original?')) return
    setGuardando(true)
    try {
      await fetch('/api/admin/episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugSel, accion: 'restaurar' }),
      })
      setEdiciones({ ...ediciones, [slugSel]: {} })
      setBorrador(null)
      setAviso('Volvió al original')
    } finally {
      setGuardando(false)
    }
  }

  if (!epBase) return null

  const momentos: string[] = actual.moments ?? epBase.moments ?? []
  const cortes: any[] = actual.detrasDeEscena ?? epBase.detrasDeEscena ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      {/* Lista de episodios */}
      <aside className="lg:border-r lg:border-cream-400/10 lg:pr-5">
        <button
          onClick={crear}
          disabled={guardando || !baseActiva}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-sm border border-gold/50 bg-gold/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} /> Nuevo episodio
        </button>

        <ul className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
          {base.map((e) => {
            const tocado = Object.keys(ediciones[e.slug] ?? {}).length > 0
            const activo = e.slug === slugSel
            return (
              <li key={e.slug}>
                <button
                  onClick={() => cambiarEpisodio(e.slug)}
                  className={`flex w-full items-center gap-2 border px-2.5 py-2 text-left transition ${
                    activo
                      ? 'border-gold/50 bg-gold/5'
                      : 'border-transparent hover:border-cream-400/20'
                  }`}
                >
                  <span className="w-6 shrink-0 text-[10px] text-cream-400/60">
                    {ediciones[e.slug]?.number ?? e.number}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs ${
                      escondidos.has(e.slug) ? 'text-cream-400/40 line-through' : 'text-cream-100'
                    }`}
                  >
                    {ediciones[e.slug]?.guest ?? e.guest}
                  </span>
                  {/* Tachado y con el ojo cerrado: sigue en el panel pero ya
                      no se ve en el sitio. */}
                  {escondidos.has(e.slug) && (
                    <EyeOff size={11} className="shrink-0 text-cream-400/40" />
                  )}
                  {tocado && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Formulario */}
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-cream-400/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cream-400/60">
              Episodio {epBase.number} · /{epBase.slug}
            </p>
            <p className="font-serif text-xl text-cream-50">{valor('guest')}</p>
          </div>
          <div className="flex items-center gap-2">
            {aviso && (
              <span
                className={`text-xs ${aviso === 'Guardado' || aviso === 'Volvió al original' ? 'text-gold' : 'text-red-400'}`}
              >
                {aviso}
              </span>
            )}
            {oculto ? (
              <button
                onClick={mostrar}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 rounded-sm border border-gold/50 bg-gold/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold transition hover:bg-gold/20 disabled:opacity-40"
              >
                <Eye size={12} /> Volver a mostrar
              </button>
            ) : (
              <button
                onClick={borrar}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 rounded-sm border border-cream-400/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:border-red-400/50 hover:text-red-300 disabled:opacity-40"
              >
                <Trash2 size={12} /> {epBase.creadoEnPanel ? 'Borrar' : 'Sacar del sitio'}
              </button>
            )}
            {Object.keys(override).length > 0 && (
              <button
                onClick={restaurar}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 rounded-sm border border-cream-400/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:border-red-400/50 hover:text-red-300 disabled:opacity-40"
              >
                <RotateCcw size={12} /> Volver al original
              </button>
            )}
            <button
              onClick={guardar}
              disabled={!borrador || guardando || !baseActiva}
              className="inline-flex items-center gap-1.5 rounded-sm bg-cream-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Check size={12} /> {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        {!baseActiva && (
          <p className="mb-5 border border-red-400/40 bg-red-400/5 px-3 py-2 text-xs text-red-300">
            La base de datos no está conectada: las ediciones no se pueden guardar.
          </p>
        )}

        {oculto && (
          <p className="mb-5 flex items-center gap-2 border border-cream-400/20 bg-ink-900/60 px-3 py-2 text-xs text-cream-200/70">
            <EyeOff size={13} className="shrink-0" />
            Este episodio está fuera del sitio: no aparece en el archivo ni en la portada, y su
            página no abre. Podés seguir editándolo y recuperarlo cuando quieras.
          </p>
        )}

        <div className="space-y-6">
          <Grupo titulo="La ficha">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Número de capítulo"
                v={valor('number')}
                on={(x) => set('number', x)}
                marca={editado('number')}
                ayuda="Se asigna solo al crear el episodio. Cambialo si el orden real es otro."
              />
              <Campo etiqueta="Invitado" v={valor('guest')} on={(x) => set('guest', x)} marca={editado('guest')} />
              <Campo etiqueta="Rol" v={valor('role')} on={(x) => set('role', x)} marca={editado('role')} />
              <Campo etiqueta="Categoría" v={valor('category')} on={(x) => set('category', x)} marca={editado('category')} />
              <div>
                <Etiqueta texto="Estado" marca={editado('status')} />
                <select
                  value={valor('status')}
                  onChange={(e) => set('status', e.target.value)}
                  className={entrada}
                >
                  {ESTADOS.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.texto}
                    </option>
                  ))}
                </select>
              </div>
              <Campo etiqueta="Fecha" v={valor('date')} on={(x) => set('date', x)} marca={editado('date')} ayuda="AAAA-MM-DD" />
              <Campo etiqueta="Duración" v={valor('duration')} on={(x) => set('duration', x)} marca={editado('duration')} />
              <Campo etiqueta="Lugar" v={valor('location')} on={(x) => set('location', x)} marca={editado('location')} />
            </div>
          </Grupo>

          <Grupo titulo="La historia">
            <Largo etiqueta="Frase principal" v={valor('quote')} on={(x) => set('quote', x)} marca={editado('quote')} filas={2} />
            <Largo etiqueta="Frase corta (sobre el video)" v={valor('shortQuote')} on={(x) => set('shortQuote', x)} marca={editado('shortQuote')} filas={2} />
            <Largo etiqueta="Lo que pasó" v={valor('summary')} on={(x) => set('summary', x)} marca={editado('summary')} filas={5} />

            <div>
              <Etiqueta texto="Frases que nos quedaron" marca={editado('moments')} />
              <div className="space-y-2">
                {momentos.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={m}
                      onChange={(e) => {
                        const copia = [...momentos]
                        copia[i] = e.target.value
                        set('moments', copia)
                      }}
                      className={entrada}
                    />
                    <button
                      onClick={() => set('moments', momentos.filter((_, j) => j !== i))}
                      className="shrink-0 px-2 text-cream-400/50 transition hover:text-red-300"
                      aria-label="Quitar frase"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set('moments', [...momentos, ''])}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:text-gold"
                >
                  <Plus size={12} /> Agregar frase
                </button>
              </div>
            </div>
          </Grupo>

          <Grupo titulo="Video y audio">
            <CampoImagen
              etiqueta="Foto del invitado"
              valor={valor('photo')}
              onCambio={(url) => set('photo', url)}
              carpeta="episodios"
              blobActivo={blobActivo}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo etiqueta="YouTube" v={valor('youtube')} on={(x) => set('youtube', x)} marca={editado('youtube')} ayuda="El link del video" />
              <Campo etiqueta="Spotify" v={valor('spotify')} on={(x) => set('spotify', x)} marca={editado('spotify')} />
              <Campo etiqueta="Apple" v={valor('apple')} on={(x) => set('apple', x)} marca={editado('apple')} />
            </div>
          </Grupo>

          <Grupo titulo="La carta">
            <CampoImagen
              etiqueta="Foto de la carta"
              valor={valorAnidado('carta', 'imagen')}
              onCambio={(url) => setAnidado('carta', 'imagen', url)}
              carpeta="cartas"
              blobActivo={blobActivo}
              ayuda="Si la dejás vacía usa la del sobre de LQLVE."
            />
            <Largo
              etiqueta="Texto de la carta"
              v={valorAnidado('carta', 'texto')}
              on={(x) => setAnidado('carta', 'texto', x)}
              marca={'carta' in actual && 'texto' in (actual.carta ?? {})}
              filas={8}
              ayuda="Es lo que se lee sobre el papel al abrirla. Vacío usa el texto general."
            />
          </Grupo>

          <Grupo titulo="El regalo">
            <CampoImagen
              etiqueta="Foto del regalo"
              valor={valorAnidado('regalo', 'imagen')}
              onCambio={(url) => setAnidado('regalo', 'imagen', url)}
              carpeta="regalos"
              blobActivo={blobActivo}
              ayuda="Recortada sin fondo queda mejor: flota sobre la página."
            />
            <Largo
              etiqueta="Qué le regalamos"
              v={valorAnidado('regalo', 'nota')}
              on={(x) => setAnidado('regalo', 'nota', x)}
              marca={'regalo' in actual && 'nota' in (actual.regalo ?? {})}
              filas={3}
            />
          </Grupo>

          <Grupo titulo="Detrás de escena" nota="Es el único contenido de suscriptores. Sin cortes cargados, el candado no tiene nada detrás.">
            <div className="space-y-3">
              {cortes.map((c: any, i: number) => (
                <div key={i} className="grid gap-2 border border-cream-400/10 p-3 sm:grid-cols-[1fr_100px_1fr_auto]">
                  <input
                    value={c?.titulo ?? ''}
                    onChange={(e) => cambiarCorte(i, 'titulo', e.target.value)}
                    placeholder="Título"
                    className={entrada}
                  />
                  <input
                    value={c?.duracion ?? ''}
                    onChange={(e) => cambiarCorte(i, 'duracion', e.target.value)}
                    placeholder="04:12"
                    className={entrada}
                  />
                  <input
                    value={c?.url ?? ''}
                    onChange={(e) => cambiarCorte(i, 'url', e.target.value)}
                    placeholder="Link del video"
                    className={entrada}
                  />
                  <button
                    onClick={() => set('detrasDeEscena', cortes.filter((_, j) => j !== i))}
                    className="px-2 text-cream-400/50 transition hover:text-red-300"
                    aria-label="Quitar corte"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => set('detrasDeEscena', [...cortes, { titulo: '', duracion: '', url: '' }])}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:text-gold"
              >
                <Plus size={12} /> Agregar corte
              </button>
            </div>
          </Grupo>
        </div>
      </div>
    </div>
  )

  function cambiarCorte(i: number, campo: string, v: string) {
    const copia = cortes.map((c: any, j: number) => (j === i ? { ...c, [campo]: v } : c))
    set('detrasDeEscena', copia)
  }
}

const entrada =
  'w-full rounded-sm border border-cream-400/15 bg-ink-900/70 px-2.5 py-2 text-xs text-cream-100 placeholder:text-cream-400/40 focus:border-gold focus:outline-none'

function Etiqueta({ texto, marca }: { texto: string; marca?: boolean }) {
  return (
    <label className="eyebrow mb-2 flex items-center gap-2">
      {texto}
      {/* El punto marca que ese campo tiene una edición guardada encima del
          archivo. Sin él, el panel se vería igual esté editado o no. */}
      {marca && <span className="h-1.5 w-1.5 rounded-full bg-gold" title="Editado" />}
    </label>
  )
}

function Campo({
  etiqueta,
  v,
  on,
  marca,
  ayuda,
}: {
  etiqueta: string
  v: string
  on: (x: string) => void
  marca?: boolean
  ayuda?: string
}) {
  return (
    <div>
      <Etiqueta texto={etiqueta} marca={marca} />
      <input value={v} onChange={(e) => on(e.target.value)} className={entrada} />
      {ayuda && <p className="mt-1 text-[11px] text-cream-400/50">{ayuda}</p>}
    </div>
  )
}

function Largo({
  etiqueta,
  v,
  on,
  marca,
  filas = 4,
  ayuda,
}: {
  etiqueta: string
  v: string
  on: (x: string) => void
  marca?: boolean
  filas?: number
  ayuda?: string
}) {
  return (
    <div>
      <Etiqueta texto={etiqueta} marca={marca} />
      <textarea value={v} onChange={(e) => on(e.target.value)} rows={filas} className={entrada} />
      {ayuda && <p className="mt-1 text-[11px] text-cream-400/50">{ayuda}</p>}
    </div>
  )
}

function Grupo({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-cream-400/10 bg-ink-800/40 p-4">
      <h3 className="mb-1 text-[11px] uppercase tracking-[0.25em] text-gold">{titulo}</h3>
      {nota && <p className="mb-3 text-[11px] text-cream-400/50">{nota}</p>}
      <div className={nota ? 'space-y-4' : 'mt-3 space-y-4'}>{children}</div>
    </section>
  )
}
