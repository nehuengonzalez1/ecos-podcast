import { Resend } from 'resend'
import { brand } from '@/lib/config/brand'
import { appUrl } from '@/lib/app-url'

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

function listaEmails(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

/** A quién avisamos. Por defecto, los mismos admins del panel. */
function destinatarios(): string[] {
  return listaEmails(process.env.CONTACT_NOTIFY_EMAILS ?? process.env.ADMIN_EMAILS)
}

/** Quién modera el muro. Puede ser gente distinta de la que recibe historias. */
function moderadores(): string[] {
  return listaEmails(
    process.env.MURO_NOTIFY_EMAILS ?? process.env.CONTACT_NOTIFY_EMAILS ?? process.env.ADMIN_EMAILS,
  )
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

/** Lo mínimo del episodio que necesitan los mails del muro. */
export type EpisodioRef = {
  slug: string
  guest: string
  number: string
  /** Casilla del protagonista. Si no está, el mensaje igual se publica. */
  guestEmail?: string
}

export type MensajeMuro = {
  nombre: string
  mensaje: string
  etiqueta: string
  ciudad?: string
  email?: string
}

/**
 * Aviso a moderación: entró un mensaje nuevo y está esperando aprobación.
 *
 * El `replyTo` apunta a quien escribió (si dejó email) para poder
 * responderle sin salir del cliente de correo. Ese dato no viaja al mail del
 * protagonista: la persona lo dejó para que le avisemos nosotros, no para
 * que quede expuesto ante un tercero.
 */
export async function enviarAvisoMuro(m: MensajeMuro, ep: EpisodioRef): Promise<boolean> {
  const to = moderadores()
  if (!resend || to.length === 0) return false

  const panel = `${appUrl()}/admin#muro`
  const html = `
    <div style="font-family:system-ui,sans-serif;background:#0a0806;color:#f5e9d3;padding:24px">
      <p style="color:#ff8000;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">
        ${brand.name} · Muro · Episodio ${escapar(ep.number)}
      </p>
      <h2 style="margin:0 0 4px;font-size:20px">${escapar(m.nombre)} le escribió a ${escapar(ep.guest)}</h2>
      <p style="color:#8f8168;font-size:13px;margin:0 0 20px">
        ${escapar(m.etiqueta)}${m.ciudad ? ` · ${escapar(m.ciudad)}` : ''}${m.email ? ` · ${escapar(m.email)}` : ' · sin email'}
      </p>
      <div style="border-left:2px solid #ff8000;padding-left:14px;margin-bottom:24px">
        <p style="white-space:pre-wrap;line-height:1.6;margin:0">${escapar(m.mensaje)}</p>
      </div>
      <a href="${panel}" style="display:inline-block;border:1px solid #ff8000;color:#ff8000;padding:10px 18px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">Moderar en el panel</a>
    </div>`

  try {
    await resend.emails.send({
      from: remitente(),
      to,
      ...(m.email ? { replyTo: m.email } : {}),
      subject: `Mensaje para ${ep.guest} — esperando moderación`,
      html,
    })
    return true
  } catch (e) {
    console.error('[mailer] no se pudo avisar del mensaje del muro:', e)
    return false
  }
}

/**
 * El mensaje llega a la persona de la que habla el episodio.
 *
 * Se manda recién cuando el mensaje está aprobado, que es el punto de toda
 * la moderación: lo que llega a esa casilla ya pasó por ojos humanos.
 */
export async function enviarMensajeAlProtagonista(
  m: MensajeMuro,
  ep: EpisodioRef,
): Promise<boolean> {
  if (!resend || !ep.guestEmail) return false

  const url = `${appUrl()}/episodio/${ep.slug}`
  const html = `
    <div style="font-family:system-ui,sans-serif;background:#0a0806;color:#f5e9d3;padding:28px">
      <p style="color:#ff8000;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px">
        ${brand.name} · ${brand.tagline}
      </p>
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:600">
        ${escapar(ep.guest.split(' ')[0])}, alguien te dejó un mensaje.
      </h2>
      <p style="color:#8f8168;font-size:13px;line-height:1.6;margin:0 0 24px">
        Lo escribieron después de ver tu episodio. Lo leímos antes de enviártelo.
      </p>

      <div style="background:#100d0a;border:1px solid rgba(143,129,104,0.25);padding:20px;margin-bottom:24px">
        <p style="white-space:pre-wrap;line-height:1.7;margin:0 0 14px;font-size:15px">${escapar(m.mensaje)}</p>
        <p style="color:#ff8000;font-size:12px;letter-spacing:1px;margin:0">
          — ${escapar(m.nombre)}${m.ciudad ? `, ${escapar(m.ciudad)}` : ''}
        </p>
      </div>

      <a href="${url}#muro" style="display:inline-block;border:1px solid #ff8000;color:#ff8000;padding:10px 18px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">Ver el muro de tu episodio</a>

      <p style="color:#8f8168;font-size:12px;line-height:1.6;margin:24px 0 0">
        Gracias por haber contado tu historia. Esto es lo que dejó.
      </p>
    </div>`

  try {
    await resend.emails.send({
      from: remitente(),
      to: [ep.guestEmail],
      // Responder vuelve al equipo, no a quien escribió: su casilla es privada.
      ...(moderadores()[0] ? { replyTo: moderadores()[0] } : {}),
      subject: `Te dejaron un mensaje en ${brand.name}`,
      html,
    })
    return true
  } catch (e) {
    console.error('[mailer] no se pudo enviar el mensaje al protagonista:', e)
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
