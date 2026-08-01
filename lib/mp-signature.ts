import crypto from 'node:crypto'

/**
 * Validación de la firma de los webhooks de Mercado Pago.
 *
 * MP manda dos cabeceras:
 *   x-signature   ->  "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45..."
 *   x-request-id  ->  identificador único de la notificación
 *
 * El manifiesto que se firma es exactamente:
 *   id:{data.id};request-id:{x-request-id};ts:{ts};
 *
 * y v1 es su HMAC-SHA256 con la clave secreta del webhook.
 *
 * Nota sobre el modelo de seguridad: aunque la firma no valide, el endpoint
 * no confía en el cuerpo del mensaje — consulta el estado real a la API de
 * MP. Esta validación es una capa adicional que evita procesar ruido y
 * detiene el pedido antes de gastar una llamada a MP.
 */

export type ResultadoFirma =
  | { valida: true }
  | { valida: false; motivo: 'sin-secreto' | 'sin-firma' | 'formato-invalido' | 'no-coincide' }

export function validarFirmaMP(
  req: Request,
  dataId: string | null,
): ResultadoFirma {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim()
  // Sin secreto configurado no podemos validar. No bloqueamos: el sitio
  // tiene que seguir funcionando si la variable todavía no se cargó.
  if (!secret) return { valida: false, motivo: 'sin-secreto' }

  const firma = req.headers.get('x-signature')
  const requestId = req.headers.get('x-request-id') ?? ''
  if (!firma) return { valida: false, motivo: 'sin-firma' }

  const partes = Object.fromEntries(
    firma.split(',').map((p) => {
      const [k, ...v] = p.split('=')
      return [k.trim(), v.join('=').trim()]
    }),
  )
  const ts = partes['ts']
  const v1 = partes['v1']
  if (!ts || !v1) return { valida: false, motivo: 'formato-invalido' }

  const manifiesto = `id:${dataId ?? ''};request-id:${requestId};ts:${ts};`
  const esperada = crypto.createHmac('sha256', secret).update(manifiesto).digest('hex')

  // Comparación en tiempo constante: una comparación normal filtra
  // información sobre la firma correcta a través del tiempo que tarda.
  const a = Buffer.from(esperada, 'hex')
  const b = Buffer.from(v1, 'hex')
  if (a.length !== b.length) return { valida: false, motivo: 'no-coincide' }

  return crypto.timingSafeEqual(a, b)
    ? { valida: true }
    : { valida: false, motivo: 'no-coincide' }
}
