'use client'

import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'

/**
 * Las categorías con las que se filtra el archivo.
 *
 * "Todos" no está en esta lista y no se edita: no es una categoría sino el
 * filtro que las apaga a todas, y lo pone la página del archivo.
 *
 * Renombrar una acá no reetiqueta los episodios que la tenían. La categoría
 * de cada episodio es un texto suyo y se corrige en su ficha. Es a propósito:
 * un renombre en cascada tocaría episodios que quizá no se querían tocar, y
 * sin forma de deshacerlo.
 */
export function CategoriasEditor({
  iniciales,
  activo,
}: {
  iniciales: string[]
  activo: boolean
}) {
  const [lista, setLista] = useState<string[]>(iniciales)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [tocado, setTocado] = useState(false)

  const cambiar = (i: number, v: string) => {
    setLista(lista.map((c, j) => (j === i ? v : c)))
    setTocado(true)
    setAviso('')
  }

  const quitar = (i: number) => {
    setLista(lista.filter((_, j) => j !== i))
    setTocado(true)
    setAviso('')
  }

  const agregar = () => {
    setLista([...lista, ''])
    setTocado(true)
    setAviso('')
  }

  const guardar = async () => {
    setGuardando(true)
    setAviso('')
    try {
      const res = await fetch('/api/admin/episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'categorias', lista }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAviso(json?.error ?? 'No se pudo guardar')
        return
      }
      // El servidor devuelve la lista ya limpia de vacíos y repetidos, así
      // que lo que queda en pantalla es exactamente lo que se guardó.
      setLista(json.categorias ?? lista)
      setTocado(false)
      setAviso('Guardado')
    } catch {
      setAviso('No se pudo guardar. Revisá la conexión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="border border-cream-400/10 bg-ink-800/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-gold">Categorías</h3>
          <p className="mt-1 text-[11px] text-cream-400/60">
            Son los filtros del archivo. Cambiar una acá no reetiqueta los episodios: la
            categoría de cada uno se corrige en su ficha.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aviso && (
            <span className={`text-xs ${aviso === 'Guardado' ? 'text-gold' : 'text-red-400'}`}>
              {aviso}
            </span>
          )}
          <button
            onClick={guardar}
            disabled={!tocado || guardando || !activo}
            className="inline-flex items-center gap-1.5 rounded-sm bg-cream-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Check size={12} /> {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {lista.map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              value={c}
              onChange={(e) => cambiar(i, e.target.value)}
              placeholder="Nombre"
              className="w-36 rounded-sm border border-cream-400/15 bg-ink-900/70 px-2.5 py-1.5 text-xs text-cream-100 placeholder:text-cream-400/40 focus:border-gold focus:outline-none"
            />
            <button
              onClick={() => quitar(i)}
              aria-label={`Quitar ${c || 'categoría'}`}
              className="px-1 text-cream-400/50 transition hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <button
          onClick={agregar}
          className="inline-flex items-center gap-1.5 self-center px-2 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:text-gold"
        >
          <Plus size={12} /> Agregar
        </button>
      </div>
    </div>
  )
}
