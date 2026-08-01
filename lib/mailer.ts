import { Resend } from 'resend'
import { brand } from '@/lib/config/brand'

/**
 * Envío de avisos por email.
 *
 * Se usa para que cada mensaje de "Contá tu historia" llegue a una casilla
 * además de guardarse en Redis. Es la única copia de esos mensajes que vive
 * fuera de la base: si Redis se vacía, las suscripciones se recuperan desde
 * Mercado Pago, pero los mensajes no tendrían de dónde volver.
 *
 * Igual que el resto de las integraciones, si no está configurado no rompe:
 * simplemente no envía.
 */
const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

export const MAILER_ACTIVE = !!apiKey

/** A quién avisamos. Por defecto, los mismos admins del panel. */
function destinatarios(): string[] {
  const raw = process.env.CONTACT_NOTIFY_EMAILS ?? process.env.ADMIN_EMAILS ?? ''
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Remitente. Sin dominio propio verificado, Resend solo permite su dominio
 * de pruebas y enviar a la casilla dueña de la cuenta.
 */
function remitente(): string {
  return process.env.RESEND_FROM ?? `${brand.name} <onboarding@resend.dev>`
}

export type MensajeContacto = {
  nombre: string
  email: string
  instagram?: string
  ubicacion?: string
  historia: string
  motivo?: string
  notas?: string
  origen?: string
}

export async function enviarAvisoContacto(m: MensajeContacto): Promise<boolean> {
  const to = destinatarios()
  if (!resend || to.length === 0) return false

  const fila = (t: string, v?: string) =>
    v ? `<tr><td style="padding:4px 12px 4px 0;color:#8f8168;white-space:nowrap">${t}</td><td style="padding:4px 0;color:#f5e9d3">${escapar(v)}</td></tr>` : ''

  const html = `
    <div style="font-family:system-ui,sans-serif;background:#0a0806;color:#f5e9d3;padding:24px">
      <p style="color:#ff8000;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">
        ${brand.name} · Contá tu historia
      </p>
      <h2 style="margin:0 0 16px;font-size:20px">${escapar(m.nombre)}</h2>
      <table style="font-size:14px;border-collapse:collapse;margin-bottom:20px">
        ${fila('Email', m.email)}
        ${fila('Instagram', m.instagram)}
        ${fila('De dónde', m.ubicacion)}
        ${fila('Llegó por', m.origen)}
      </table>
      <p style="color:#8f8168;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Su historia</p>
      <p style="white-space:pre-wrap;line-height:1.6;margin:0 0 20px">${escapar(m.historia)}</p>
      ${bloque('Por qué quiere contarla', m.motivo)}
      ${bloque('A tener en cuenta', m.notas)}
    </div>`

  try {
    await resend.emails.send({
      from: remitente(),
      to,
      replyTo: m.email, // responder va directo a la persona
      subject: `Nueva historia de ${m.nombre}`,
      html,
    })
    return true
  } catch (e) {
    console.error('[mailer] no se pudo enviar el aviso:', e)
    return false
  }
}

function bloque(titulo: string, texto?: string): string {
  if (!texto) return ''
  return `<p style="color:#8f8168;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">${titulo}</p>
          <p style="white-space:pre-wrap;line-height:1.6;margin:0 0 20px">${escapar(texto)}</p>`
}

/** El contenido lo escribe un visitante: nunca va crudo al HTML del mail. */
function escapar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
