import { redirect } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { brand } from '@/lib/config/brand'
import { cargarProductosParaPanel, TIENDA_PUBLICA } from '@/lib/tienda'
import {
  todosLosOverrides,
  productosOcultos,
  productosNuevos,
  TIENDA_EDITABLE,
} from '@/lib/tienda-contenido'
import { NavPanel } from '../NavPanel'
import { ProductosEditor, type ProductoEditable } from '../ProductosEditor'

export const metadata = { title: `Tienda · ${brand.name}` }
export const dynamic = 'force-dynamic'

export default async function TiendaAdminPage() {
  if (!(await isAdmin())) redirect('/')

  const [todos, overrides, ocultos, nuevos] = await Promise.all([
    cargarProductosParaPanel(),
    todosLosOverrides(),
    productosOcultos(),
    productosNuevos(),
  ])

  const delPanel = new Set(nuevos.map((p: any) => p.slug))
  const paraEditar: ProductoEditable[] = todos.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria ?? '',
    resumen: p.resumen ?? '',
    precio: p.precio ?? 0,
    imagen: p.imagen ?? '',
    descripcion: p.descripcion ?? [],
    variantes: p.variantes ?? null,
    detalles: p.detalles ?? [],
    estado: p.estado ?? 'agotado',
    creadoEnPanel: delPanel.has(p.slug),
  }))

  const blobActivo = !!process.env.BLOB_READ_WRITE_TOKEN

  return (
    <section className="pt-32 pb-24 min-h-[80vh]">
      <div className="container-page">
        <p className="eyebrow mb-4">Admin</p>
        <h1 className="title-display text-5xl">Tienda</h1>

        <NavPanel />

        {/* Saber si la tienda está abierta o no cambia por completo lo que
            significa editar acá, así que se dice antes que nada. */}
        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs ${
            TIENDA_PUBLICA
              ? 'border-gold/40 bg-gold/5 text-cream-200/90'
              : 'border-cream-400/25 text-cream-200/75'
          }`}
        >
          {TIENDA_PUBLICA ? (
            <>
              <Eye size={14} className="text-gold" />
              La tienda está abierta: todo lo que edites acá lo ve cualquiera.
            </>
          ) : (
            <>
              <EyeOff size={14} />
              La tienda está cerrada: solo vos la ves. Para abrirla, poné{' '}
              <code>TIENDA_PUBLICA=1</code> en Vercel.
            </>
          )}
        </div>

        <p className="mt-6 max-w-2xl text-sm text-cream-200/70">
          Lo que se edita acá se guarda aparte y se le superpone al archivo del proyecto, porque en
          Vercel los archivos no se pueden reescribir. El punto dorado marca los productos con
          ediciones guardadas.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-cream-400/70">
          La dirección de cada producto no se puede cambiar: si alguien guardó o compartió el
          enlace, cambiarla lo rompe.
        </p>

        {!blobActivo && (
          <p className="mt-4 max-w-2xl border border-cream-400/20 px-3 py-2 text-xs text-cream-200/60">
            El store de archivos no está configurado: los botones de subir están apagados y hay que
            pegar la URL de las fotos.
          </p>
        )}

        <div className="mt-6">
          <ProductosEditor
            productos={paraEditar}
            editados={Object.keys(overrides)}
            ocultos={ocultos}
            blobActivo={blobActivo}
            activo={TIENDA_EDITABLE}
          />
        </div>
      </div>
    </section>
  )
}
