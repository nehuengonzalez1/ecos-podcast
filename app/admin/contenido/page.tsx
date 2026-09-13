import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { brand } from '@/lib/config/brand'
import { episodiosDelArchivo } from '@/lib/episodios'
import {
  todosLosOverrides,
  episodiosNuevos,
  episodiosOcultos,
  CONTENIDO_ACTIVO,
} from '@/lib/contenido'
import { EpisodiosEditor } from '../EpisodiosEditor'
import { NavPanel } from '../NavPanel'

export const metadata = { title: `Contenido · ${brand.name}` }
export const dynamic = 'force-dynamic'

/**
 * La mitad del panel que edita el contenido.
 *
 * Vive aparte de las metricas porque no comparten nada: esta pagina solo
 * necesita el catalogo y las ediciones, y no tiene por que esperar a que se
 * carguen suscriptores, analitica y la cola de moderacion para mostrarse.
 */
export default async function ContenidoPage() {
  if (!(await isAdmin())) redirect('/')

  // La lista del editor es el archivo mas los creados desde acá. Los nuevos
  // van primero, que es donde se los busca después de crearlos.
  const [overrides, nuevos, ocultos] = await Promise.all([
    todosLosOverrides(),
    episodiosNuevos(),
    episodiosOcultos(),
  ])
  const base = [...nuevos, ...episodiosDelArchivo()]

  // El token de Blob es de servidor: si el store esta creado se decide aca y
  // baja al editor como un booleano.
  const blobActivo = !!process.env.BLOB_READ_WRITE_TOKEN

  return (
    <section className="pt-32 pb-24 min-h-[80vh]">
      <div className="container-page">
        <p className="eyebrow mb-4">Admin</p>
        <h1 className="title-display text-5xl">Contenido</h1>

        <NavPanel />

        <p className="mt-6 max-w-2xl text-sm text-cream-200/70">
          Lo que se edita acá se guarda aparte y se le superpone al archivo del proyecto, porque
          en Vercel los archivos no se pueden reescribir. El punto dorado marca los campos
          editados; vaciar uno lo devuelve a su valor original.
        </p>

        {!blobActivo && (
          <p className="mt-4 max-w-2xl border border-cream-400/20 px-3 py-2 text-xs text-cream-200/60">
            El store de archivos no está configurado: los botones de subir están apagados y hay
            que pegar la URL de las imágenes.
          </p>
        )}

        <div className="mt-6">
          <EpisodiosEditor
            base={base}
            overrides={overrides}
            blobActivo={blobActivo}
            baseActiva={CONTENIDO_ACTIVO}
            ocultos={ocultos}
          />
        </div>
      </div>
    </section>
  )
}
