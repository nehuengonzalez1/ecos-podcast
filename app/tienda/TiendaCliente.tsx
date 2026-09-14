'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Gift,
  Grid2X2,
  Heart,
  Home,
  Layers,
  Search,
  Shirt,
  ShoppingCart,
} from 'lucide-react'
import { useCarrito } from '@/components/tienda/Carrito'

export type ProductoVista = {
  slug: string
  nombre: string
  categoria: string
  resumen: string
  precio: number
  precioTexto: string
  cuotaTexto: string
  imagen: string | null
  talles: string[]
  colores: string[]
  agotado: boolean
}

/** Los dibujos de la barra de rubros. La clave es el nombre del rubro. */
const ICONOS: Record<string, typeof Shirt> = {
  Todos: Grid2X2,
  Indumentaria: Shirt,
  Accesorios: Layers,
  Escritura: BookOpen,
  Juegos: Layers,
  Lifestyle: Home,
  'Ediciones Especiales': Gift,
}

const ORDENES = [
  { valor: 'relevantes', texto: 'Más relevantes' },
  { valor: 'menor', texto: 'Menor precio' },
  { valor: 'mayor', texto: 'Mayor precio' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
]

/** Los colores de la muestra, con su equivalente en pantalla. */
const MUESTRAS: Record<string, string> = {
  Negro: '#0a0a0a',
  Blanco: '#f5f5f5',
  Gris: '#8a8a8a',
  Crema: '#e6d5b3',
}

export function TiendaCliente({
  productos,
  rubros,
  talles,
  colores,
  precioMaximo,
}: {
  productos: ProductoVista[]
  rubros: string[]
  talles: string[]
  colores: string[]
  precioMaximo: number
}) {
  const { agregar } = useCarrito()

  const [rubro, setRubro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [categorias, setCategorias] = useState<string[]>([])
  const [tope, setTope] = useState(precioMaximo)
  const [talle, setTalle] = useState<string[]>([])
  const [color, setColor] = useState<string[]>([])
  const [soloStock, setSoloStock] = useState(false)
  const [orden, setOrden] = useState('relevantes')
  const [favoritos, setFavoritos] = useState<string[]>([])

  const alternar = (lista: string[], v: string, set: (x: string[]) => void) =>
    set(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    const filtrados = productos.filter((p) => {
      if (rubro !== 'Todos' && p.categoria !== rubro) return false
      // Las categorías de la barra lateral se suman a la de arriba: sin
      // ninguna tildada no filtran nada, en vez de esconderlo todo.
      if (categorias.length && !categorias.includes(p.categoria)) return false
      if (p.precio > tope) return false
      if (talle.length && !talle.some((t) => p.talles.includes(t))) return false
      if (color.length && !color.some((c) => p.colores.includes(c))) return false
      if (soloStock && p.agotado) return false
      if (q && !`${p.nombre} ${p.resumen} ${p.categoria}`.toLowerCase().includes(q)) return false
      return true
    })

    const ordenado = [...filtrados]
    if (orden === 'menor') ordenado.sort((a, b) => a.precio - b.precio)
    else if (orden === 'mayor') ordenado.sort((a, b) => b.precio - a.precio)
    else if (orden === 'nombre') ordenado.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    // "Más relevantes" es el orden del catálogo, que es una decisión editorial:
    // lo que se quiere mostrar primero va primero.
    return ordenado
  }, [productos, rubro, categorias, tope, talle, color, soloStock, busqueda, orden])

  const limpiar = () => {
    setRubro('Todos')
    setBusqueda('')
    setCategorias([])
    setTope(precioMaximo)
    setTalle([])
    setColor([])
    setSoloStock(false)
  }

  const hayFiltros =
    rubro !== 'Todos' ||
    busqueda.trim() !== '' ||
    categorias.length > 0 ||
    tope < precioMaximo ||
    talle.length > 0 ||
    color.length > 0 ||
    soloStock

  return (
    <>
      {/* Barra de rubros */}
      <div className="border-y border-cream-400/10 bg-ink-900/60">
        <div className="container-page">
          <div className="flex overflow-x-auto">
            {['Todos', ...rubros].map((r) => {
              const Icono = ICONOS[r] ?? Layers
              const activo = rubro === r
              return (
                <button
                  key={r}
                  onClick={() => setRubro(r)}
                  className={`relative flex min-w-[7.5rem] flex-1 flex-col items-center gap-2 border-r border-cream-400/10 px-4 py-5 text-[10px] uppercase tracking-[0.15em] transition last:border-r-0 ${
                    activo ? 'text-cream-50' : 'text-cream-400/70 hover:text-cream-200'
                  }`}
                >
                  <Icono size={22} strokeWidth={1.25} />
                  <span className="whitespace-nowrap">{r}</span>
                  {activo && <span className="absolute inset-x-6 bottom-0 h-px bg-gold" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
          {/* Columna de filtros */}
          <aside className="space-y-8">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-400/60"
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar productos…"
                className="w-full rounded-sm border border-cream-400/20 bg-ink-800/60 py-2.5 pl-9 pr-3 text-xs text-cream-100 placeholder:text-cream-400/50 focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-cream-400/70">
                Filtrar por
              </p>

              <Bloque titulo="Categoría">
                <Casilla
                  etiqueta="Todos"
                  marcada={categorias.length === 0}
                  onCambio={() => setCategorias([])}
                />
                {rubros.map((c) => (
                  <Casilla
                    key={c}
                    etiqueta={c}
                    marcada={categorias.includes(c)}
                    onCambio={() => alternar(categorias, c, setCategorias)}
                  />
                ))}
              </Bloque>

              <Bloque titulo="Precio">
                <input
                  type="range"
                  min={0}
                  max={precioMaximo}
                  step={1000}
                  value={tope}
                  onChange={(e) => setTope(Number(e.target.value))}
                  className="w-full accent-gold"
                  aria-label="Precio máximo"
                />
                <div className="mt-1 flex justify-between text-[11px] text-cream-400/70">
                  <span>$ 0</span>
                  <span>${tope.toLocaleString('es-AR')}</span>
                </div>
              </Bloque>

              {!!talles.length && (
                <Bloque titulo="Talle">
                  <div className="flex flex-wrap gap-2">
                    {talles.map((t) => (
                      <button
                        key={t}
                        onClick={() => alternar(talle, t, setTalle)}
                        className={`h-8 min-w-[2.25rem] rounded-sm border px-2 text-[11px] transition ${
                          talle.includes(t)
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-cream-400/20 text-cream-200/80 hover:border-gold/50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Bloque>
              )}

              {!!colores.length && (
                <Bloque titulo="Color">
                  <div className="flex flex-wrap gap-3">
                    {colores.map((c) => (
                      <button
                        key={c}
                        onClick={() => alternar(color, c, setColor)}
                        title={c}
                        aria-label={c}
                        aria-pressed={color.includes(c)}
                        style={{ background: MUESTRAS[c] ?? '#555' }}
                        className={`h-7 w-7 rounded-full border-2 transition ${
                          color.includes(c) ? 'border-gold' : 'border-cream-400/30'
                        }`}
                      />
                    ))}
                  </div>
                </Bloque>
              )}

              <Bloque titulo="Disponibilidad">
                <Casilla
                  etiqueta="Solo productos en stock"
                  marcada={soloStock}
                  onCambio={() => setSoloStock((v) => !v)}
                />
              </Bloque>

              {hayFiltros && (
                <button
                  onClick={limpiar}
                  className="mt-6 text-[10px] uppercase tracking-[0.18em] text-gold transition hover:text-gold-light"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="border-t border-cream-400/10 pt-8 text-center">
              <span className="text-2xl text-cream-400/40">∞</span>
              <p className="mt-3 text-[10px] uppercase leading-relaxed tracking-[0.2em] text-cream-400/60">
                Más que una tienda.
                <br />
                Es una extensión
                <br />
                de la conversación.
              </p>
            </div>
          </aside>

          {/* Grilla */}
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cream-200/80">
                {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
              </p>
              <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-cream-400/70">
                Ordenar por
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="rounded-sm border border-cream-400/20 bg-ink-800/60 px-3 py-2 text-[11px] normal-case tracking-normal text-cream-100 focus:border-gold focus:outline-none"
                >
                  {ORDENES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibles.length === 0 ? (
              <div className="border border-cream-400/10 bg-ink-800/40 px-6 py-16 text-center">
                <p className="font-serif text-lg italic text-cream-200/60">
                  No hay productos con esos filtros.
                </p>
                {hayFiltros && (
                  <button onClick={limpiar} className="btn-ghost mt-6">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {visibles.map((p) => (
                  <article
                    key={p.slug}
                    className="group flex flex-col border border-cream-400/10 bg-ink-800/50 transition hover:border-gold/30"
                  >
                    <div className="relative">
                      <Link href={`/tienda/${p.slug}`} className="block">
                        <div className="aspect-[4/5] w-full overflow-hidden bg-ink-700">
                          {p.imagen ? (
                            <img
                              src={p.imagen}
                              alt={p.nombre}
                              loading="lazy"
                              className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] ${
                                p.agotado ? 'opacity-45 grayscale' : ''
                              }`}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-cream-400/25">
                              <span className="text-3xl">∞</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <button
                        onClick={() => alternar(favoritos, p.slug, setFavoritos)}
                        aria-label={
                          favoritos.includes(p.slug)
                            ? `Quitar ${p.nombre} de favoritos`
                            : `Guardar ${p.nombre} en favoritos`
                        }
                        aria-pressed={favoritos.includes(p.slug)}
                        className="absolute right-3 top-3 text-cream-100/80 transition hover:text-gold"
                      >
                        <Heart
                          size={17}
                          className={favoritos.includes(p.slug) ? 'fill-gold text-gold' : ''}
                        />
                      </button>

                      {p.agotado && (
                        <span className="absolute left-3 top-3 rounded-sm border border-cream-400/25 bg-ink-900/80 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-cream-200/80">
                          Agotado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <Link href={`/tienda/${p.slug}`}>
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-50">
                          {p.nombre}
                        </h3>
                        <p className="mt-1 text-[11px] text-cream-400/70">{p.resumen}</p>
                      </Link>

                      <p className="mt-3 text-base text-cream-50">{p.precioTexto}</p>
                      <p className="mt-0.5 text-[11px] text-cream-400/70">
                        3 cuotas de {p.cuotaTexto}
                      </p>

                      {/* Un producto con talles no se puede agregar desde acá:
                          habría que elegir uno por él, y el talle elegido a
                          dedo es justo lo que después se cambia o se devuelve.
                          Se manda a la ficha, que es donde se elige. */}
                      {p.talles.length ? (
                        <Link
                          href={`/tienda/${p.slug}`}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-cream-400/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cream-100 transition hover:border-gold hover:text-gold"
                        >
                          <ShoppingCart size={12} />
                          Elegir talle
                        </Link>
                      ) : (
                        <button
                          onClick={() =>
                            agregar({
                              slug: p.slug,
                              nombre: p.nombre,
                              precio: p.precio,
                              imagen: p.imagen,
                            })
                          }
                          disabled={p.agotado}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-cream-400/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cream-100 transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ShoppingCart size={12} />
                          Agregar al carrito
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-cream-200/85">{titulo}</p>
      {children}
    </div>
  )
}

function Casilla({
  etiqueta,
  marcada,
  onCambio,
}: {
  etiqueta: string
  marcada: boolean
  onCambio: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-xs text-cream-200/80">
      <input
        type="checkbox"
        checked={marcada}
        onChange={onCambio}
        className="h-3.5 w-3.5 accent-gold"
      />
      {etiqueta}
    </label>
  )
}
