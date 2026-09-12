'use client'

import { useRef, useState } from 'react'
import { Upload, Link as LinkIcon, X } from 'lucide-react'

/**
 * Un campo de imagen: subir un archivo o pegar una URL.
 *
 * Los dos caminos conviven a proposito. Subir es lo comodo, pero necesita el
 * store de Blob creado en Vercel; mientras no exista, pegar la URL de una
 * imagen ya publicada deja cargar contenido igual. Si el store no esta, el
 * boton de subir se muestra apagado y explica por que, en vez de fallar al
 * apretarlo.
 */
export function CampoImagen({
  etiqueta,
  valor,
  onCambio,
  carpeta,
  blobActivo,
  ayuda,
}: {
  etiqueta: string
  valor: string
  onCambio: (url: string) => void
  carpeta: string
  blobActivo: boolean
  ayuda?: string
}) {
  const archivoRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const subir = async (archivo: File) => {
    setSubiendo(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('carpeta', carpeta)
      const res = await fetch('/api/admin/subir', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.detalle ?? json?.error ?? 'No se pudo subir')
        return
      }
      onCambio(json.url)
    } catch {
      setError('No se pudo subir. Revisá la conexión.')
    } finally {
      setSubiendo(false)
      if (archivoRef.current) archivoRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="eyebrow mb-2 block">{etiqueta}</label>

      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden border border-cream-400/15 bg-ink-900">
          {valor ? (
            // Deliberadamente <img> y no next/image: la URL puede venir de
            // Blob o de cualquier dominio que se pegue a mano, y next/image
            // exige tener cada dominio declarado de antemano.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valor} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest text-cream-400/40">
              vacío
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => archivoRef.current?.click()}
              disabled={!blobActivo || subiendo}
              title={blobActivo ? undefined : 'Falta crear el store de Blob en Vercel'}
              className="inline-flex items-center gap-1.5 rounded-sm border border-cream-400/25 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cream-100 transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Upload size={12} /> {subiendo ? 'Subiendo…' : 'Subir'}
            </button>

            {valor && (
              <button
                type="button"
                onClick={() => onCambio('')}
                className="inline-flex items-center gap-1.5 rounded-sm border border-cream-400/20 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cream-200/60 transition hover:border-red-400/50 hover:text-red-300"
              >
                <X size={12} /> Quitar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LinkIcon size={12} className="shrink-0 text-cream-400/50" />
            <input
              value={valor}
              onChange={(e) => onCambio(e.target.value)}
              placeholder="o pegá una URL"
              className="w-full rounded-sm border border-cream-400/15 bg-ink-900/70 px-2.5 py-1.5 text-xs text-cream-100 placeholder:text-cream-400/40 focus:border-gold focus:outline-none"
            />
          </div>

          <input
            ref={archivoRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) subir(f)
            }}
          />

          {error && <p className="text-[11px] text-red-400">{error}</p>}
          {!blobActivo && !error && (
            <p className="text-[11px] text-cream-400/50">
              Para subir archivos falta crear el store de Blob. Por ahora, pegá una URL.
            </p>
          )}
          {ayuda && <p className="text-[11px] text-cream-400/50">{ayuda}</p>}
        </div>
      </div>
    </div>
  )
}
