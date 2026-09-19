import { redirect } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { SORTEOS_PUBLICOS } from '@/lib/env'
import { brand } from '@/lib/config/brand'
import { cargarSorteos, cargarSorteosParaPanel, estadoDe } from '@/lib/sorteos'
import {
  todosLosOverrides,
  sorteosOcultos,
  sorteosNuevos,
  SORTEOS_EDITABLES,
} from '@/lib/sorteos-contenido'
import { contarParticipantes, SORTEOS_ACTIVOS } from '@/lib/participaciones'
import { NavPanel } from '../NavPanel'
import { SorteosPanel, type FilaSorteo } from '../SorteosPanel'
import { SorteosEditor, type SorteoEditable } from '../SorteosEditor'

export const metadata = { title: `Sorteos · ${brand.name}` }
export const dynamic = 'force-dynamic'

/**
 * El panel de sorteos: operar los que están en marcha y editar el contenido.
 *
 * La lista de anotados no se carga acá, solo su cantidad: se pide al abrir un
 * sorteo, que es cuando se la mira. Traer los participantes de todos al
 * entrar sería esperar por datos que casi siempre no se van a ver.
 */
export default async function SorteosAdminPage() {
  if (!(await isAdmin())) redirect('/')

  // Dos lecturas distintas a propósito. Arriba se opera sobre lo que el sitio
  // muestra; el editor, en cambio, tiene que ver también los escondidos, que
  // son justamente los que hay que poder recuperar.
  const [visibles, todos, overrides, ocultos, nuevos] = await Promise.all([
    cargarSorteos(),
    cargarSorteosParaPanel(),
    todosLosOverrides(),
    sorteosOcultos(),
    sorteosNuevos(),
  ])

  const conteos = await Promise.all(visibles.map((s) => contarParticipantes(s.slug)))

  const filas: FilaSorteo[] = visibles.map((s, i) => ({
    slug: s.slug,
    titulo: s.titulo,
    categoria: s.categoria,
    estado: estadoDe(s),
    cierra: s.cierra,
    anotados: conteos[i],
  }))

  const delPanel = new Set(nuevos.map((s: any) => s.slug))
  const paraEditar: SorteoEditable[] = todos.map((s) => ({
    slug: s.slug,
    titulo: s.titulo,
    categoria: s.categoria ?? '',
    resumen: s.resumen ?? '',
    imagen: s.imagen ?? '',
    cierra: s.cierra,
    abre: s.abre ?? '',
    ganadores: s.ganadores ?? 1,
    lugar: s.lugar ?? '',
    descripcion: s.descripcion ?? [],
    nota: s.nota ?? '',
    incluye: s.incluye ?? [],
    condiciones: s.condiciones ?? [],
    creadoEnPanel: delPanel.has(s.slug),
  }))

  const totalAnotados = conteos.reduce((a, b) => a + b, 0)

  // El token de Blob es de servidor: si el store está creado se decide acá y
  // baja al editor como un booleano.
  const blobActivo = !!process.env.BLOB_READ_WRITE_TOKEN

  return (
    <section className="pt-32 pb-24 min-h-[80vh]">
      <div className="container-page">
        <p className="eyebrow mb-4">Admin</p>
        <h1 className="title-display text-5xl">Sorteos</h1>

        <NavPanel />

        {/* Saber si los sorteos estan abiertos o no cambia por completo lo que
            significa editar aca, asi que se dice antes que nada. */}
        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs ${
            SORTEOS_PUBLICOS
              ? 'border-gold/40 bg-gold/5 text-cream-200/90'
              : 'border-cream-400/25 text-cream-200/75'
          }`}
        >
          {SORTEOS_PUBLICOS ? (
            <>
              <Eye size={14} className="text-gold" />
              Los sorteos estan abiertos: todo lo que edites aca lo ve cualquiera.
            </>
          ) : (
            <>
              <EyeOff size={14} />
              Los sorteos estan cerrados: solo vos los ves. Para abrirlos, poné{' '}
              <code>SORTEOS_PUBLICOS=1</code> en Vercel.
            </>
          )}
        </div>

        <h2 className="mt-8 text-[11px] uppercase tracking-[0.25em] text-gold">En marcha</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream-200/70">
          Abrí un sorteo para ver quiénes se anotaron y sortear cuando cierre el plazo. Hay{' '}
          <span className="text-gold">{totalAnotados}</span>{' '}
          {totalAnotados === 1 ? 'participación' : 'participaciones'} en total.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-cream-400/70">
          El ganador se elige al azar del lado del servidor, sobre la lista completa. Cada tirada
          queda registrada con su fecha: si se sortea de nuevo, el panel lo muestra.
        </p>

        <div className="mt-5">
          <SorteosPanel filas={filas} activo={SORTEOS_ACTIVOS} />
        </div>

        <h2 className="mt-14 text-[11px] uppercase tracking-[0.25em] text-gold">Contenido</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream-200/70">
          Lo que se edita acá se guarda aparte y se le superpone al archivo del proyecto, porque en
          Vercel los archivos no se pueden reescribir. El punto dorado marca los sorteos con
          ediciones guardadas.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-cream-400/70">
          Sacar un sorteo del sitio no borra a los anotados: quien se anotó sigue en la lista, y si
          lo sacaste por error podés volver a mostrarlo sin perder nada.
        </p>

        {!blobActivo && (
          <p className="mt-4 max-w-2xl border border-cream-400/20 px-3 py-2 text-xs text-cream-200/60">
            El store de archivos no está configurado: los botones de subir están apagados y hay que
            pegar la URL de las imágenes.
          </p>
        )}

        <div className="mt-5">
          <SorteosEditor
            sorteos={paraEditar}
            editados={Object.keys(overrides)}
            ocultos={ocultos}
            blobActivo={blobActivo}
            activo={SORTEOS_EDITABLES}
          />
        </div>
      </div>
    </section>
  )
}
