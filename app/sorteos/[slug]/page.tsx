import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Calendar,
  Camera,
  ChevronRight,
  Clock,
  Coffee,
  Gift,
  Image as ImageIcon,
  Infinity as Infinito,
  MapPin,
  Ticket,
  Truck,
  Users,
} from 'lucide-react'
import { brand } from '@/lib/config/brand'
import { isAdmin } from '@/lib/admin'
import { SORTEOS_PUBLICOS } from '@/lib/env'
import { buscarSorteo, estadoDe, type EstadoSorteo } from '@/lib/sorteos'
import { CuentaRegresiva } from '@/components/CuentaRegresiva'
import { textoRestante } from '@/lib/tiempo'
import { ImagenSorteo } from '@/components/SorteoCard'
import { FormularioSorteo } from './FormularioSorteo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  // Tambien aca: el titulo se ve en la pestaña y en lo que comparte un
  // buscador, asi que no puede delatar un sorteo que todavia no es publico.
  if (!(SORTEOS_PUBLICOS || (await isAdmin()))) return { title: `Sorteos · ${brand.name}` }
  const s = await buscarSorteo(slug)
  if (!s) return { title: `Sorteos · ${brand.name}` }
  return { title: `${s.titulo} · Sorteos · ${brand.name}`, description: s.resumen }
}

// Sin generateStaticParams a propósito: con las rutas prerenderidas, el
// estado del sorteo queda congelado en el build y uno ya cerrado seguiría
// mostrando el formulario de participación hasta el siguiente deploy.

/** Los dibujos de "qué incluye". La clave viaja en los datos, el ícono vive acá. */
const ICONOS: Record<string, typeof Ticket> = {
  entrada: Ticket,
  camara: Camera,
  cafe: Coffee,
  foto: ImageIcon,
  regalo: Gift,
  envio: Truck,
}

const ETIQUETA_ESTADO: Record<EstadoSorteo, string> = {
  activo: 'Sorteo activo',
  proximo: 'Sorteo próximo',
  finalizado: 'Sorteo finalizado',
}

function fechaLarga(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d)
}

export default async function SorteoPage({ params }: { params: Promise<{ slug: string }> }) {
  // Se pregunta de nuevo y no se confia en que la lista ya lo hizo: quien
  // tenga la direccion de un sorteo puede entrar directo sin pasar por ella,
  // y entonces ese control no habria corrido nunca.
  if (!(SORTEOS_PUBLICOS || (await isAdmin()))) notFound()

  const { slug } = await params
  const s = await buscarSorteo(slug)
  if (!s) notFound()

  const estado = estadoDe(s)

  return (
    <section className="pt-28 pb-20">
      <div className="container-page">
        <nav className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cream-400/70">
          <Link href="/sorteos" className="transition hover:text-gold">
            Sorteos
          </Link>
          <ChevronRight size={12} />
          <span className="text-cream-200/80">{s.titulo}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
          <div>
            <ImagenSorteo
              src={s.imagen}
              alt={s.titulo}
              className="aspect-[4/5] rounded-sm border border-cream-400/10"
              apagada={estado === 'finalizado'}
            >
              <span className="absolute left-3 top-3 rounded-sm border border-cream-400/15 bg-ink-900/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cream-100/80 backdrop-blur">
                {s.categoria}
              </span>
            </ImagenSorteo>

            {s.nota && (
              <p className="mt-4 max-w-[16rem] font-hand text-xl leading-snug text-cream-200/70">
                {s.nota}
              </p>
            )}
          </div>

          <div>
            <p className="eyebrow">{ETIQUETA_ESTADO[estado]}</p>
            <h1 className="title-display mt-2 text-4xl leading-none md:text-5xl">{s.titulo}</h1>
            <p className="body-copy mt-4 text-base italic leading-relaxed text-cream-200/80">
              {s.resumen}
            </p>

            <dl className="mt-8 space-y-5">
              <Dato icono={Calendar} titulo="Cierre del sorteo">
                {fechaLarga(s.cierra)}
              </Dato>

              {/* En un sorteo cerrado el contador no tiene nada que contar, y
                  dejarlo en cero se lee como un error. */}
              {estado !== 'finalizado' && (
                <Dato icono={Clock} titulo="Tiempo restante">
                  <CuentaRegresiva cierra={s.cierra} inicial={textoRestante(s.cierra)} />
                </Dato>
              )}

              <Dato icono={Users} titulo={s.ganadores === 1 ? 'Ganador' : 'Ganadores'}>
                {s.ganadores} {s.ganadores === 1 ? 'persona' : 'personas'}
              </Dato>

              <Dato icono={MapPin} titulo="Lugar">
                {s.lugar}
              </Dato>
            </dl>

            <div className="mt-10 flex flex-col items-start gap-1.5 text-cream-400/35">
              <Infinito size={22} strokeWidth={1.25} />
              <p className="text-[9px] uppercase tracking-[0.3em]">{brand.fullName}</p>
            </div>
          </div>

          <div>
            <FormularioSorteo
              slug={s.slug}
              abierto={estado === 'activo'}
              motivoCerrado={
                estado === 'proximo'
                  ? 'Este sorteo todavía no abrió. Volvé cuando arranque para anotarte.'
                  : 'Este sorteo ya cerró. Al ganador lo contactamos por email y por Instagram.'
              }
            />
          </div>
        </div>

        <div className="mt-16 grid gap-10 border-t border-cream-400/10 pt-10 md:grid-cols-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cream-50">
              Sobre el sorteo
            </h2>
            <div className="mt-4 space-y-3">
              {s.descripcion.map((p, i) => (
                <p key={i} className="body-copy text-sm leading-relaxed text-cream-200/75">
                  {p}
                </p>
              ))}
            </div>

            {s.nota && (
              <div className="mt-7 flex flex-col items-start gap-2 text-cream-400/50">
                <Infinito size={20} strokeWidth={1.25} />
                <p className="max-w-[15rem] font-hand text-lg leading-snug text-cream-200/60">
                  {s.nota}
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cream-50">
              ¿Qué incluye?
            </h2>
            <ul className="mt-4 space-y-4">
              {s.incluye.map((item, i) => {
                const Icono = ICONOS[item.icono] ?? Gift
                return (
                  <li key={i} className="flex gap-3">
                    <Icono size={17} className="mt-0.5 shrink-0 text-gold/80" strokeWidth={1.5} />
                    <span className="body-copy text-sm leading-relaxed text-cream-200/75">
                      {item.texto}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cream-50">
              Condiciones
            </h2>
            <ul className="mt-4 space-y-2.5">
              {s.condiciones.map((c, i) => (
                <li
                  key={i}
                  className="body-copy flex gap-2.5 text-sm leading-relaxed text-cream-200/75"
                >
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                  {c}
                </li>
              ))}
            </ul>
            <div className="divider-line mx-0 mt-6" />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Una fila del bloque de datos: ícono, rótulo chico arriba y el valor abajo. */
function Dato({
  icono: Icono,
  titulo,
  children,
}: {
  icono: typeof Calendar
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3.5">
      <Icono size={17} className="mt-0.5 shrink-0 text-gold/80" strokeWidth={1.5} />
      <div>
        <dt className="text-[10px] uppercase tracking-[0.2em] text-cream-400/70">{titulo}</dt>
        <dd className="mt-1 text-sm text-cream-100/90">{children}</dd>
      </div>
    </div>
  )
}
