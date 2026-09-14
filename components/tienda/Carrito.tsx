'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ItemCarrito = {
  slug: string
  nombre: string
  precio: number
  imagen: string | null
  /** El talle o color elegido, si el producto tenía opciones. */
  variante?: string
  cantidad: number
}

type Contexto = {
  items: ItemCarrito[]
  unidades: number
  total: number
  abierto: boolean
  agregar: (item: Omit<ItemCarrito, 'cantidad'>) => void
  quitar: (clave: string) => void
  cambiarCantidad: (clave: string, cantidad: number) => void
  vaciar: () => void
  abrir: () => void
  cerrar: () => void
}

const Ctx = createContext<Contexto | null>(null)

const CLAVE = 'lqlve:carrito'

/**
 * La clave de una línea del carrito.
 *
 * Incluye la variante porque la misma remera en S y en L son dos líneas
 * distintas: sin esto, agregar la L encima de la S sumaría cantidad a una
 * sola y el talle quedaría mal.
 */
export function claveDe(slug: string, variante?: string): string {
  return variante ? `${slug}::${variante}` : slug
}

/**
 * El carrito.
 *
 * Vive en el navegador de quien compra, en localStorage. No hay forma de
 * cobrar todavía, así que guardarlo en el servidor sería inventar una tabla
 * de pedidos que nadie puede completar. Cuando se conecte el cobro, esto pasa
 * a ser el paso previo al checkout y recién ahí tiene sentido persistirlo.
 */
export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([])
  const [abierto, setAbierto] = useState(false)
  const [listo, setListo] = useState(false)

  // Se lee después del primer render, no durante: en el servidor no existe
  // localStorage, y leerlo al construir el estado haría que el HTML y el
  // primer dibujo del navegador no coincidan.
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE)
      if (crudo) setItems(JSON.parse(crudo))
    } catch {
      /* si el navegador lo bloquea, se arranca con el carrito vacío */
    }
    setListo(true)
  }, [])

  useEffect(() => {
    if (!listo) return
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items))
    } catch {
      /* sin espacio o bloqueado: el carrito sigue funcionando en memoria */
    }
  }, [items, listo])

  const agregar = useCallback((item: Omit<ItemCarrito, 'cantidad'>) => {
    setItems((prev) => {
      const clave = claveDe(item.slug, item.variante)
      const i = prev.findIndex((x) => claveDe(x.slug, x.variante) === clave)
      if (i === -1) return [...prev, { ...item, cantidad: 1 }]
      const copia = [...prev]
      copia[i] = { ...copia[i], cantidad: copia[i].cantidad + 1 }
      return copia
    })
    setAbierto(true)
  }, [])

  const quitar = useCallback((clave: string) => {
    setItems((prev) => prev.filter((x) => claveDe(x.slug, x.variante) !== clave))
  }, [])

  const cambiarCantidad = useCallback((clave: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((x) => claveDe(x.slug, x.variante) !== clave)
        : prev.map((x) =>
            claveDe(x.slug, x.variante) === clave ? { ...x, cantidad } : x,
          ),
    )
  }, [])

  const valor = useMemo<Contexto>(
    () => ({
      items,
      unidades: items.reduce((n, x) => n + x.cantidad, 0),
      total: items.reduce((n, x) => n + x.precio * x.cantidad, 0),
      abierto,
      agregar,
      quitar,
      cambiarCantidad,
      vaciar: () => setItems([]),
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
    }),
    [items, abierto, agregar, quitar, cambiarCantidad],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCarrito(): Contexto {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Pasa si alguien usa el carrito fuera del provider. Mejor un error claro
    // acá que un `null` reventando tres componentes más abajo.
    throw new Error('useCarrito necesita estar dentro de <CarritoProvider>')
  }
  return ctx
}
