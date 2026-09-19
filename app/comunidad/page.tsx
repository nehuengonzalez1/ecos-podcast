import { isAdmin } from '@/lib/admin'
import { SUSCRIPCION_PUBLICA } from '@/lib/env'
import { brand } from '@/lib/config/brand'
import { estadisticas } from '@/lib/estadisticas'
import { ComunidadClient } from './ComunidadClient'

export const metadata = { title: `Comunidad · ${brand.name}` }

/**
 * Se renderiza a pedido porque la decision depende de quien mira: quien
 * administra ve la suscripcion entera y el resto la ve cerrada. Congelada en
 * el build, todos verian lo mismo.
 */
export const dynamic = 'force-dynamic'

export default async function ComunidadPage() {
  const abierta = SUSCRIPCION_PUBLICA || (await isAdmin())

  // Se resuelven aca porque contar los episodios publicados necesita leer
  // los datos y las ediciones del panel, que no existen en el navegador.
  const stats = await estadisticas()

  // El precio se lee aca, en el servidor, y solo se manda si corresponde.
  // Leerlo del lado del cliente lo dejaba incrustado en el javascript que
  // baja el navegador, y entonces esconderlo en pantalla no servia de nada.
  const price = abierta ? Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS ?? '1500') : null

  return (
    <ComunidadClient
      abierta={abierta}
      price={price}
      avisoSoloVos={abierta && !SUSCRIPCION_PUBLICA}
      stats={stats}
    />
  )
}
