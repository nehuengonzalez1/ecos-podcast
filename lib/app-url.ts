/**
 * La URL publica del sitio.
 *
 * Se usa para armar links que se leen fuera del sitio: los mails del muro
 * y el back_url del checkout de Mercado Pago. Un valor equivocado aca no se
 * nota navegando -- se nota cuando alguien termina de pagar y cae en un 404,
 * o cuando el protagonista abre el mail y el link no lleva a ningun lado.
 *
 * Vive en un solo lugar a proposito. Antes la resolvian por separado
 * lib/mailer.ts y lib/mp.ts, y alcanza con que una de las dos se quede atras
 * para que esa mitad de los links apunte a cualquier parte.
 *
 * Es de servidor: las variables VERCEL_* no llegan al navegador.
 */

/**
 * Orden de preferencia, del mas explicito al mas generico.
 *
 * Siempre devuelve algo: quien la usa no tiene que contemplar el caso vacio.
 */
export function appUrl(): string {
  // 1. Lo configurado a mano gana. Es la unica forma de apuntar a un dominio
  //    propio que Vercel todavia no tiene dado de alta.
  const explicita = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicita) return sinBarraFinal(explicita)

  // 2. En produccion, el dominio estable del proyecto. Vercel lo inyecta solo
  //    y lo mantiene al dia si el proyecto se renombra, que es justo lo que
  //    fallo cuando ecos-podcast paso a llamarse lqlve-podcast y la variable
  //    quedo apuntando a una alias que ya no existia.
  const produccion = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (process.env.VERCEL_ENV === 'production' && produccion) {
    return `https://${produccion}`
  }

  // 3. Fuera de produccion, la URL del deploy que esta corriendo. Asi lo que
  //    se prueba en una rama no termina mandando gente al sitio en vivo.
  //    VERCEL_PROJECT_PRODUCTION_URL tambien existe en preview, por eso no
  //    alcanza con preguntar si esta definida: hay que mirar el entorno.
  const deploy = process.env.VERCEL_URL
  if (deploy) return `https://${deploy}`

  return 'http://localhost:3000'
}

function sinBarraFinal(u: string): string {
  return u.replace(/\/+$/, '')
}
