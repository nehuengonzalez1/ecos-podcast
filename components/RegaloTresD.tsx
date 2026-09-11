'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * El regalo como objeto 3D.
 *
 * La foto no se pega sobre un rectángulo: se monta sobre una hoja de papel
 * construida como geometría, con curvatura, espesor y luz real. Eso es lo que
 * hace que se lea como un objeto y no como una imagen inclinada -- una foto
 * plana no puede auto-sombrearse, y la curvatura tomando la luz al girar es
 * justamente lo que delata que hay volumen.
 *
 * La silueta sale del canal alfa de la foto: el papel se recorta con la forma
 * del objeto en vez de ser una tarjeta rectangular. Por eso el sobre se ve
 * como un sobre y el cuadernillo como un cuadernillo.
 *
 * Se carga aparte del resto de la página (ver ModalRegalo): son unos cientos
 * de kB que solo descarga quien abre un regalo.
 */

/** Cuánto se curva la hoja. En unidades de escena, sobre un ancho de ~2. */
const CURVATURA = 0.16

/** Separación entre la cara de adelante y la de atrás: el espesor del papel. */
const ESPESOR = 0.012

/**
 * Hasta dónde se puede girar, en radianes.
 *
 * No es una limitación caprichosa: la foto está montada sobre una hoja, y una
 * hoja vista de canto es una línea. Girando más allá de estos ángulos el
 * objeto se adelgaza hasta desaparecer y se ve de dónde sale el truco. Dentro
 * de este rango la curvatura y la luz hacen su trabajo y se lee como un
 * objeto con volumen; pasado el rango, se lee como una foto parada de canto.
 *
 * Un modelo de verdad (.glb) no necesitaría este tope.
 */
const LIMITE_Y = 0.95 // ~54 grados
const LIMITE_X = 0.5 // ~29 grados

export function RegaloTresD({
  imagen,
  alt,
  onListo,
}: {
  imagen: string
  alt: string
  /** Avisa cuando la escena ya está dibujada, para poder ocultar la foto. */
  onListo?: () => void
}) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    let vivo = true
    let animacion = 0
    let renderer: THREE.WebGLRenderer | null = null
    const aDesechar: Array<{ dispose: () => void }> = []

    try {
      const escena = new THREE.Scene()

      const camara = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
      camara.position.set(0, 0, 6.2)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(contenedor.clientWidth, contenedor.clientHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      contenedor.appendChild(renderer.domElement)

      // Luz: una clave al frente y arriba, que es la que modela la curvatura,
      // y un relleno suave para que la cara en sombra no quede negra.
      // El ambiente marca el piso de brillo: con poco, el objeto sale más
      // apagado que la foto y la gente nota que "se oscureció" al pasar al
      // 3D. La direccional va encima para modelar la curvatura, que es lo
      // que aporta el volumen.
      escena.add(new THREE.AmbientLight(0xffffff, 2.1))
      const clave = new THREE.DirectionalLight(0xfff2e0, 2.4)
      clave.position.set(-1.6, 2.4, 3.2)
      escena.add(clave)
      const relleno = new THREE.DirectionalLight(0xffc98a, 0.6)
      relleno.position.set(2.5, -1, 1.5)
      escena.add(relleno)

      const grupo = new THREE.Group()
      escena.add(grupo)

      const cargador = new THREE.TextureLoader()
      cargador.setCrossOrigin('anonymous')
      cargador.load(
        imagen,
        (textura) => {
          if (!vivo) return
          textura.colorSpace = THREE.SRGBColorSpace
          textura.anisotropy = renderer?.capabilities.getMaxAnisotropy() ?? 1
          aDesechar.push(textura)

          // La hoja toma la proporción real de la foto, así el objeto no
          // aparece estirado ni achatado.
          const prop = textura.image.width / textura.image.height
          const ancho = prop >= 1 ? 2.6 : 2.6 * prop
          const alto = prop >= 1 ? 2.6 / prop : 2.6

          const geo = new THREE.PlaneGeometry(ancho, alto, 64, 64)
          curvar(geo, CURVATURA)
          geo.computeVertexNormals()
          aDesechar.push(geo)

          // alphaTest y no transparencia: así el papel se recorta con la
          // silueta del objeto y sigue escribiendo en el buffer de
          // profundidad, que es lo que permite que la cara de atrás quede
          // correctamente tapada por la de adelante al girar.
          const frente = new THREE.MeshStandardMaterial({
            map: textura,
            alphaTest: 0.5,
            roughness: 0.92,
            metalness: 0,
            side: THREE.FrontSide,
          })
          aDesechar.push(frente)

          // El dorso: el mismo recorte, apagado. Es el reverso del papel, no
          // se vuelve a ver la foto del otro lado.
          const dorso = new THREE.MeshStandardMaterial({
            map: textura,
            alphaTest: 0.5,
            color: 0x6b6459,
            roughness: 1,
            metalness: 0,
            side: THREE.BackSide,
          })
          aDesechar.push(dorso)

          const caraFrente = new THREE.Mesh(geo, frente)
          caraFrente.position.z = ESPESOR / 2
          grupo.add(caraFrente)

          const caraDorso = new THREE.Mesh(geo, dorso)
          caraDorso.position.z = -ESPESOR / 2
          grupo.add(caraDorso)

          onListo?.()
        },
        undefined,
        () => {
          if (vivo) setError(true)
        },
      )

      // Giro: el arrastre manda, y si nadie toca, gira despacio solo.
      let giroX = 0
      let giroY = 0
      let objetivoX = 0
      let objetivoY = 0
      let arrastrando = false
      let ultimo = { x: 0, y: 0 }
      let ocioso = 0
      let tiempo = 0

      const lienzo = renderer.domElement
      lienzo.style.touchAction = 'none'
      lienzo.style.cursor = 'grab'

      const abajo = (e: PointerEvent) => {
        arrastrando = true
        ocioso = 0
        ultimo = { x: e.clientX, y: e.clientY }
        // Capturar el puntero puede fallar si el navegador ya lo solto; no es
        // motivo para tirar la interaccion abajo.
        try {
          lienzo.setPointerCapture(e.pointerId)
        } catch {}
        lienzo.style.cursor = 'grabbing'
      }
      const mover = (e: PointerEvent) => {
        if (!arrastrando) return
        objetivoY += (e.clientX - ultimo.x) * 0.008
        objetivoX += (e.clientY - ultimo.y) * 0.008
        objetivoX = Math.max(-LIMITE_X, Math.min(LIMITE_X, objetivoX))
        objetivoY = Math.max(-LIMITE_Y, Math.min(LIMITE_Y, objetivoY))
        ultimo = { x: e.clientX, y: e.clientY }
        ocioso = 0
      }
      const arriba = (e: PointerEvent) => {
        arrastrando = false
        try {
          lienzo.releasePointerCapture(e.pointerId)
        } catch {}
        lienzo.style.cursor = 'grab'
      }
      lienzo.addEventListener('pointerdown', abajo)
      lienzo.addEventListener('pointermove', mover)
      lienzo.addEventListener('pointerup', arriba)
      lienzo.addEventListener('pointercancel', arriba)

      const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const medir = () => {
        if (!renderer || !contenedor.clientWidth) return
        renderer.setSize(contenedor.clientWidth, contenedor.clientHeight)
        camara.aspect = contenedor.clientWidth / contenedor.clientHeight
        camara.updateProjectionMatrix()
      }
      const observador = new ResizeObserver(medir)
      observador.observe(contenedor)

      const dibujar = () => {
        if (!vivo || !renderer) return
        animacion = requestAnimationFrame(dibujar)

        if (!arrastrando && !menosMovimiento) {
          ocioso += 1
          // Tras un rato quieto se balancea solo, para que el objeto nunca
          // quede del todo inmóvil. Es un vaivén y no un giro continuo: con
          // el giro topando contra el límite, quedaba clavado contra la pared
          // en vez de volver. Se entra al vaivén interpolando, así retoma
          // desde donde lo dejaron en vez de pegar un salto.
          if (ocioso > 90) {
            tiempo += 0.006
            objetivoY += (Math.sin(tiempo) * 0.38 - objetivoY) * 0.02
            objetivoX += (Math.sin(tiempo * 0.66) * 0.1 - objetivoX) * 0.02
          }
        }

        // Interpolación: el giro persigue al objetivo en vez de saltar, que
        // es lo que le da peso al movimiento.
        giroX += (objetivoX - giroX) * 0.09
        giroY += (objetivoY - giroY) * 0.09
        grupo.rotation.x = giroX
        grupo.rotation.y = giroY

        renderer.render(escena, camara)
      }
      dibujar()

      const paraLimpiar = renderer
      return () => {
        vivo = false
        cancelAnimationFrame(animacion)
        observador.disconnect()
        lienzo.removeEventListener('pointerdown', abajo)
        lienzo.removeEventListener('pointermove', mover)
        lienzo.removeEventListener('pointerup', arriba)
        lienzo.removeEventListener('pointercancel', arriba)
        aDesechar.forEach((x) => x.dispose())
        paraLimpiar.dispose()
        lienzo.remove()
      }
    } catch {
      // Sin WebGL -- pasa en equipos viejos y en algunos navegadores con la
      // aceleración apagada -- se avisa y ModalRegalo deja la foto.
      setError(true)
      return () => {
        vivo = false
      }
    }
  }, [imagen, onListo])

  if (error) return null

  return (
    <div
      ref={contenedorRef}
      role="img"
      aria-label={alt}
      className="h-full w-full"
    />
  )
}

/**
 * Curva la hoja como un papel apoyado: más hundido en el centro y levantado
 * en los bordes verticales. Sin esto la malla sería un plano, y un plano con
 * una foto encima se ve igual de chato que la foto sola.
 */
function curvar(geo: THREE.PlaneGeometry, fuerza: number) {
  const pos = geo.attributes.position
  const params = geo.parameters as { width: number }
  const mitad = params.width / 2
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const t = x / mitad // -1 a 1
    pos.setZ(i, -(1 - t * t) * fuerza)
  }
  pos.needsUpdate = true
}
