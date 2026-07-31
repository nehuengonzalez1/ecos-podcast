'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Heart, Lock, Mic, Star, User } from 'lucide-react'
import { brand } from '@/lib/config/brand'

const LIMITES = { historia: 2000, motivo: 1000, notas: 1000 }

const ORIGENES = [
  'Instagram',
  'YouTube',
  'TikTok',
  'Spotify',
  'Un amigo o conocido',
  'Otro',
]

const PASOS = [
  { icon: Heart, titulo: 'Leemos cada historia', texto: 'Con respeto y atención.' },
  { icon: User, titulo: 'Te contactamos', texto: `Si tu historia conecta con ${brand.name}.` },
  { icon: Mic, titulo: 'Conversamos', texto: 'Queremos conocerte mejor.' },
  { icon: Star, titulo: 'Contás tu historia', texto: 'Y dejás tu huella.' },
]

const inputBase =
  'w-full rounded-sm border border-cream-400/15 bg-ink-900/70 px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-400/50 transition focus:border-gold focus:outline-none'

export default function ContactPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [contadores, setContadores] = useState({ historia: 0, motivo: 0, notas: 0 })

  const contar = (campo: keyof typeof LIMITES) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setContadores((c) => ({ ...c, [campo]: e.target.value.length }))

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')
    const data = new FormData(e.currentTarget)
    const payload: Record<string, string> = {}
    data.forEach((v, k) => (payload[k] = String(v)))
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) router.push('/gracias')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <section className="spotlight-bg pt-32 pb-10">
        <div className="container-page text-center">
          <h1 className="title-display text-5xl leading-none md:text-6xl">
            Contá tu historia.
          </h1>
          <p className="subtitle-signature mx-auto mt-5 max-w-2xl text-3xl md:text-4xl">
            Tu historia puede ser la que alguien necesita escuchar.
          </p>
          <div className="divider-line" />
          <p className="body-copy mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-200/70">
            En {brand.name} creemos que cada historia tiene el poder de transformar.
            <br />
            Si sentís que la tuya puede sanar, acompañar o inspirar algo en otros,
            <br />
            te invitamos a compartirla con nosotros.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-page">
          <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[1fr_260px]">
            <form onSubmit={onSubmit} className="card-panel space-y-5">
              <div>
                <label htmlFor="nombre" className="eyebrow mb-2 block">Nombre completo</label>
                <input id="nombre" name="nombre" required placeholder="Tu nombre y apellido" className={inputBase} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="eyebrow mb-2 block">Correo electrónico</label>
                  <input id="email" name="email" type="email" required placeholder="tu@correo.com" className={inputBase} />
                </div>
                <div>
                  <label htmlFor="instagram" className="eyebrow mb-2 block">Instagram (opcional)</label>
                  <input id="instagram" name="instagram" placeholder="@tuusuario" className={inputBase} />
                </div>
              </div>

              <div>
                <label htmlFor="ubicacion" className="eyebrow mb-2 block">¿De dónde sos?</label>
                <input id="ubicacion" name="ubicacion" required placeholder="Ciudad, país" className={inputBase} />
              </div>

              <div>
                <label htmlFor="historia" className="eyebrow mb-2 block">Contanos tu historia</label>
                <textarea
                  id="historia"
                  name="historia"
                  required
                  rows={6}
                  maxLength={LIMITES.historia}
                  onChange={contar('historia')}
                  placeholder="Contanos brevemente tu historia..."
                  className={inputBase}
                />
                <p className="mt-1 text-right text-[11px] text-cream-400/60">
                  {contadores.historia} / {LIMITES.historia}
                </p>
              </div>

              <div>
                <label htmlFor="motivo" className="eyebrow mb-2 block">
                  ¿Por qué querés contar tu historia en {brand.name}?
                </label>
                <textarea
                  id="motivo"
                  name="motivo"
                  rows={4}
                  maxLength={LIMITES.motivo}
                  onChange={contar('motivo')}
                  placeholder="¿Qué te gustaría que las personas se lleven al escucharla?"
                  className={inputBase}
                />
                <p className="mt-1 text-right text-[11px] text-cream-400/60">
                  {contadores.motivo} / {LIMITES.motivo}
                </p>
              </div>

              <div>
                <label htmlFor="notas" className="eyebrow mb-2 block">
                  ¿Hay algo importante que debamos saber antes de contactarte?
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  rows={3}
                  maxLength={LIMITES.notas}
                  onChange={contar('notas')}
                  placeholder="(Opcional)"
                  className={inputBase}
                />
                <p className="mt-1 text-right text-[11px] text-cream-400/60">
                  {contadores.notas} / {LIMITES.notas}
                </p>
              </div>

              <div>
                <label htmlFor="origen" className="eyebrow mb-2 block">¿Cómo te enteraste de {brand.name}?</label>
                <select id="origen" name="origen" defaultValue="" className={inputBase}>
                  <option value="" disabled>Seleccioná una opción</option>
                  {ORIGENES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 text-sm text-cream-200/80">
                <input
                  type="checkbox"
                  name="consentimiento"
                  value="si"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
                />
                <span>Acepto que mis datos sean utilizados para responder a mi solicitud.</span>
              </label>

              <button type="submit" className="btn-gold w-full justify-center" disabled={status === 'sending'}>
                {status === 'sending' ? 'Enviando…' : 'Enviar historia'} <ArrowRight size={16} />
              </button>

              <p className="flex items-center justify-center gap-2 text-[11px] text-cream-400/70">
                <Lock size={12} /> Tu historia está segura con nosotros. Nunca compartimos tus datos.
              </p>

              {status === 'error' && (
                <p className="text-center text-sm text-red-400" role="alert">
                  Ocurrió un error. Probá de nuevo en unos minutos.
                </p>
              )}
            </form>

            <aside className="card-panel hidden text-center lg:block">
              <div className="font-serif text-4xl leading-none text-gold/60">&ldquo;</div>
              <p className="body-copy mt-3 text-xl italic leading-snug text-cream-100/90">
                Todas las historias importan.
              </p>
              <p className="body-copy mt-4 text-xl italic leading-snug text-cream-100/90">
                Pero algunas pueden cambiar más de una vida.
              </p>
              <div className="divider-line" />
              <p className="body-copy text-sm italic text-cream-200/60">Gracias por confiar.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-cream-400/10 bg-ink-800/40 py-10">
        <div className="container-page">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map(({ icon: Icono, titulo, texto }) => (
              <div key={titulo} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">
                  <Icono size={16} />
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-cream-100/90">{titulo}</div>
                  <p className="body-copy mt-1 text-sm text-cream-200/70">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
