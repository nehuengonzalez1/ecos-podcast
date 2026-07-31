import Link from 'next/link'
import { Instagram, Youtube } from 'lucide-react'
import { brand } from '@/lib/config/brand'

/* lucide-react no trae los logos de TikTok ni Spotify (solo incluye unas
   pocas marcas). Se dibujan a mano para no depender de otra libreria. */
function TikTok({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12v-3.15a5.73 5.73 0 0 0-.77-.05A5.74 5.74 0 1 0 15.6 15.4V9.01a7.35 7.35 0 0 0 4.4 1.4V7.32a4.3 4.3 0 0 1-3.4-1.5Z" />
    </svg>
  )
}

function Spotify({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.42a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.22c3.81-.87 7.08-.5 9.72 1.11.29.18.39.58.21.86Zm1.23-2.73a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.23.48.71.25 1.07Zm.1-2.85c-3.22-1.91-8.54-2.09-11.62-1.16a.93.93 0 1 1-.54-1.79c3.53-1.07 9.4-.86 13.11 1.34a.94.94 0 0 1-.95 1.61Z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-cream-400/10 bg-ink-900">
      <div className="container-page py-14">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-lqlve.png"
              alt={brand.fullName}
              className="mx-auto h-8 w-auto md:mx-0"
            />
            <div className="mt-3 text-[11px] uppercase tracking-[0.35em] text-gold/70">
              {brand.fullName}
            </div>
            <p className="body-copy mt-4 max-w-sm text-base text-cream-200/70">
              Hay historias que cambian vidas,<br />
              Algunas todavía no fueron contadas.
            </p>
          </div>

          <div className="text-center text-sm text-cream-200/80 md:text-left">
            <div className="eyebrow mb-3">Explorar</div>
            <ul className="space-y-2">
              <li><Link href="/archivo" className="hover:text-gold">El Archivo</Link></li>
              <li><Link href="/nosotros" className="hover:text-gold">Nosotros</Link></li>
              <li><Link href="/comunidad" className="hover:text-gold">Comunidad</Link></li>
              <li><Link href="/contacto" className="hover:text-gold">Contá tu historia</Link></li>
              <li><Link href="/cuenta" className="hover:text-gold">Mi cuenta</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-right">
            <div className="eyebrow mb-3 md:text-right">Contacto</div>
            <a
              href={`mailto:${brand.emailContact}`}
              className="text-sm text-cream-200/80 transition hover:text-gold"
            >
              {brand.emailContact}
            </a>

            <div className="eyebrow mb-3 mt-8 md:text-right">Seguinos</div>
            <div className="flex items-center justify-center gap-4 md:justify-end">
              <a href={brand.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="text-cream-200/70 transition hover:text-gold">
                <Youtube size={20} />
              </a>
              <a href={brand.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-cream-200/70 transition hover:text-gold">
                <Instagram size={20} />
              </a>
              <a href={brand.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="text-cream-200/70 transition hover:text-gold">
                <TikTok size={20} />
              </a>
              <a href={brand.socials.spotify} target="_blank" rel="noreferrer" aria-label="Spotify" className="text-cream-200/70 transition hover:text-gold">
                <Spotify size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-cream-400/10 pt-6 text-center">
          <p className="font-hand text-xl text-gold/80">Historias que quedan.</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-cream-400/50">
            © {new Date().getFullYear()} {brand.name} · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  )
}
