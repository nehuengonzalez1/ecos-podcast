import { Resend, type CreateEmailOptions } from 'resend'
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

/**
 * Estado de la integracion, para que el panel lo muestre.
 *
 * No alcanza con saber si hay clave: con la clave puesta pero sin
 * destinatarios el envio se saltea igual, y desde afuera se ve identico
 * (no llega ningun mail). Por eso devuelve las dos cosas.
 */
export function estadoMailer() {
  return {
    activo: MAILER_ACTIVE,
    destinatarios: moderadores().length,
    remitente: remitente(),
  }
}

/**
 * Despacha un mail y decide si realmente salio.
 *
 * El SDK de Resend no tira excepcion cuando la API rechaza el envio:
 * devuelve `{ data, error }` con `error` cargado y la promesa resuelta. Con
 * solo un try/catch, una clave invalida o un remitente no verificado se
 * veian como exito, el mail no llegaba nunca y no quedaba rastro en los
 * logs. Por eso se mira `error` ademas de atajar la excepcion, que sigue
 * siendo posible si se cae la red.
 */
async function despachar(payload: CreateEmailOptions, etiqueta: string): Promise<boolean> {
  try {
    const { error } = await resend!.emails.send(payload)
    if (error) {
      // El statusCode es lo que distingue una clave invalida (401) de un
      // permiso que falta (403), un payload rechazado (422) o una falla del
      // lado de Resend (5xx). Sin el, todos se leen igual. Va tambien el
      // remitente, que es la otra mitad de los rechazos, pero no los
      // destinatarios: son datos personales y no hacen falta para esto.
      console.error(
        `[mailer] ${etiqueta} Resend rechazo el envio:`,
        error.name,
        `status=${error.statusCode}`,
        `from=${payload.from}`,
        error.message,
      )
      return false
    }
    return true
  } catch (e) {
    console.error(`[mailer] ${etiqueta}`, e)
    return false
  }
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

  return despachar(
    {
      from: remitente(),
      to,
      replyTo: m.email, // responder va directo a la persona
      subject: `Nueva historia de ${m.nombre}`,
      html,
    },
    'no se pudo enviar el aviso:',
  )
}

/** Lo mínimo del episodio que necesita el aviso de moderación del muro. */
export type EpisodioRef = {
  slug: string
  guest: string
  number: string
}

export type MensajeMuro = {
  nombre: string
  mensaje: string
  etiqueta: string
  ciudad?: string
  /**
   * Por qué el filtro lo retuvo. Sin esto el mensaje ya salió publicado.
   *
   * Cambia el tono del aviso entero: uno es "andá a leer esto ahora", el otro
   * es "esto entró al muro". Mezclarlos haría que el que importa se pierda.
   */
  motivo?: string
}

/**
 * Aviso de que entró un mensaje al muro.
 *
 * Llegan los dos casos, pero bien distinguidos: el retenido pide una acción
 * y el publicado es solo para enterarse. Si alguna vez el volumen molesta, el
 * que se puede dejar de mandar es el segundo.
 *
 * Es el único mail que dispara el muro. Los mensajes no se le reenvían a la
 * persona del episodio: viven en la página y se leen ahí.
 */
export async function enviarAvisoMuro(m: MensajeMuro, ep: EpisodioRef): Promise<boolean> {
  const to = moderadores()
  if (!resend || to.length === 0) return false

  const retenido = !!m.motivo
  const panel = `${appUrl()}/admin#muro`
  const html = `
    <div style="font-family:system-ui,sans-serif;background:#0a0806;color:#f5e9d3;padding:24px">
      <p style="color:#ff8000;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">
        ${brand.name} · Muro · Episodio ${escapar(ep.number)}
      </p>
      <h2 style="margin:0 0 4px;font-size:20px">${escapar(m.nombre)} le escribió a ${escapar(ep.guest)}</h2>
      <p style="color:#8f8168;font-size:13px;margin:0 0 20px">
        ${escapar(m.etiqueta)}${m.ciudad ? ` · ${escapar(m.ciudad)}` : ''}
      </p>
      ${
        retenido
          ? `<p style="border:1px solid #ff8000;color:#ff8000;font-size:13px;padding:10px 14px;margin:0 0 20px">
               <strong>Retenido, no está publicado.</strong><br />${escapar(m.motivo!)}
             </p>`
          : `<p style="color:#8f8168;font-size:13px;margin:0 0 20px">
               Ya está publicado en el muro. No hay nada que hacer, salvo que quieras bajarlo.
             </p>`
      }
      <div style="border-left:2px solid #ff8000;padding-left:14px;margin-bottom:24px">
        <p style="white-space:pre-wrap;line-height:1.6;margin:0">${escapar(m.mensaje)}</p>
      </div>
      <a href="${panel}" style="display:inline-block;border:1px solid #ff8000;color:#ff8000;padding:10px 18px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">${
        retenido ? 'Revisar en el panel' : 'Ver el panel'
      }</a>
    </div>`

  return despachar(
    {
      from: remitente(),
      to,
      subject: retenido
        ? `Retenido: mensaje para ${ep.guest} — hay que revisarlo`
        : `Mensaje nuevo para ${ep.guest}`,
      html,
    },
    'no se pudo avisar del mensaje del muro:',
  )
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
