export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Con qué nombre le hablamos a quien vino al episodio.
 *
 * Casi siempre alcanza el nombre de pila: "Santi Morales" → "Santi". Tratar
 * de usted o por nombre completo sonaría ajeno en un sitio donde la gente
 * viene a dejarle un mensaje a alguien que le contó algo íntimo.
 *
 * Pero cortar por el primer espacio rompe los nombres artísticos: "La Loba"
 * quedaba en "La", y el muro decía "Dejale un mensaje a LA". Cuando el nombre
 * arranca con artículo, el nombre es todo.
 *
 * Vive acá y no en cada componente porque lo usan cinco lugares distintos —
 * el muro, la carta, la ventana del mensaje — y tienen que decir lo mismo.
 */
export function nombreParaHablarle(nombre: string): string {
  const limpio = nombre.trim()
  const partes = limpio.split(/\s+/)
  if (partes.length < 2) return limpio
  if (/^(la|el|los|las|lo)$/i.test(partes[0])) return limpio
  return partes[0]
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    // Saca los acentos por propiedad Unicode, no por rango de caracteres.
    //
    // Antes el rango estaba escrito con los caracteres literales y en algun
    // guardado se corrompieron: la expresion dejo de reconocerlos, y "Ibanez"
    // con tilde y eñe terminaba en "ib-ez" -- la tilde sobrevivia y despues
    // se convertia en guion. Escribirlo como rango de escapes tampoco sirve,
    // porque al guardar el archivo vuelven a convertirse en literales.
    //
    // Esta forma es solo ASCII, asi que no hay nada que se pueda corromper.
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Stable pseudo-random rotation based on a numeric seed */
export function tiltFromSeed(seed: number, max = 3): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453
  const frac = s - Math.floor(s)
  return (frac * 2 - 1) * max
}
