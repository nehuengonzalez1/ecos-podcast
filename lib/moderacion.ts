/**
 * Filtro de moderación del muro.
 *
 * El muro publica al instante. Pedirle a alguien que espere una aprobación
 * para decir "gracias por contarlo" enfría justo el impulso que uno quiere
 * que llegue, y deja el muro de un episodio recién salido vacío durante
 * horas. Lo que decide este módulo es la excepción: qué mensajes NO salen
 * solos y quedan esperando una lectura humana en el panel.
 *
 * Es una lista de palabras y patrones, no un modelo de lenguaje: no entiende
 * ironía ni sarcasmo. Una burla fina escrita sin malas palabras va a pasar.
 * Por eso el panel puede bajar un mensaje ya publicado, y por eso el criterio
 * acá es retener ante la duda: retener de más cuesta un click, retener de
 * menos cuesta que la persona del episodio lea algo que le duele, en su
 * propia página y con su nombre arriba.
 *
 * La contracara es que hay falsos positivos a propósito. "Qué historia de
 * mierda te tocó vivir" es un mensaje solidario y queda retenido igual,
 * porque la misma construcción escrita contra alguien no lo es y el filtro no
 * puede distinguirlas.
 */

export type Revision = {
  /** Si el mensaje debe esperar aprobación en vez de publicarse solo. */
  retener: boolean
  /** Por qué se retuvo. Se le muestra a quien modera, nunca al público. */
  motivo?: string
}

/**
 * Deja el texto comparable sin cambiar lo que dice.
 *
 * Saca acentos, traduce el disfraz numérico habitual (g0rd0, put@, m13rda) y
 * colapsa las letras repetidas de los gritos (putooooo). Sin esto, cualquiera
 * de esos tres trucos alcanza para saltear la lista entera.
 *
 * El resultado solo se usa para comparar. Lo que se guarda y se publica es
 * siempre el texto original, tal como lo escribieron.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    // "p u t o" y "p.u.t.o" vuelven a ser una palabra. Solo se juntan letras
    // que están solas entre separadores, así "de mierda" o "a mi" quedan
    // intactos y no se pegan palabras legítimas.
    .replace(/(?<=(?:^|[^\p{L}])\p{L})[\s.\-_*]+(?=\p{L}(?:[^\p{L}]|$))/gu, '')
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/(.)\1{2,}/g, '$1')
}

/**
 * Arma un patrón que solo matchea la palabra entera.
 *
 * Sin esto la lista se vuelve inusable: "puta" vive adentro de "diputado" y
 * "gil" adentro de "vigilante", así que un mensaje perfectamente normal
 * quedaría retenido.
 */
function palabra(fragmento: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${fragmento})(?![\\p{L}\\p{N}])`, 'u')
}

type Regla = {
  motivo: string
  patrones: RegExp[]
}

/**
 * Las reglas, de la más específica a la más general.
 *
 * El orden importa solo para el motivo que se muestra: se devuelve el de la
 * primera que matchea, y conviene que sea el más preciso de los que aplican.
 */
const REGLAS: Regla[] = [
  {
    motivo: 'Amenaza o deseo de que a alguien le pase algo malo',
    patrones: [
      /ojala\s+(te|le|se)\s+\w*(muera|mueras|pase|pudra|arrepient)/u,
      palabra('morite|matate|muerete|ahorcate|tirate\\s+de'),
      /te\s+(voy|vamos)\s+a\s+(matar|romper|buscar|encontrar|reventar)/u,
      /(te\s+lo\s+merec|lo\s+que\s+te\s+paso\s+te\s+lo\s+merec)/u,
      palabra('and[ao](te)?\\s+a\\s+morir(te)?'),
    ],
  },
  {
    motivo: 'Ataque o burla dirigida a una persona',
    patrones: [
      // "gordo de mierda", "negro de mierda", "autista de mierda": una sola
      // regla cubre toda la familia, que siempre es un ataque a la persona.
      /\bde\s+(mierda|cuarta|cuarta\s+categoria)\b/u,
      /(me\s+)?das?\s+(asco|pena|lastima|verguenza)/u,
      /(sos|eres|es)\s+(un|una)\s+(asco|desastre|fracaso|payas)/u,
      palabra('foca|ballena|cerd[oa]s?|chanch[oa]s?|vac[ao]'),
      palabra('retrasad[oa]s?|mongolic[oa]s?|mogolic[oa]s?|subnormal(es)?'),
      /\b(muert[oa]\s+de\s+hambre|pobre\s+diabl[oa])\b/u,
      /(mentis|mentira|inventa|actua|chamuy)\w*\s+(todo|para\s+dar\s+(pena|lastima))/u,
    ],
  },
  {
    motivo: 'Discriminación',
    patrones: [
      palabra('sudac[ao]s?|bolit[ao]s?|negrit[oa]\\s+viller[oa]|viller[oa]s?'),
      palabra('maric[oa]n(es)?|marica|trav[ao]s?|trolo|tortiller[ao]'),
      palabra('nazi|judi[oa]\\s+de|gitan[oa]\\s+de'),
    ],
  },
  {
    motivo: 'Insulto o mala palabra',
    patrones: [
      palabra('put[oa]s?|putazo'),
      palabra('pelotud[oa]s?|bolud[oa]s?|forr[oa]s?|conchud[oa]s?'),
      palabra('hij[oa]\\s+de\\s+put[ao]|hdp|lpm|rtmc'),
      palabra('mierda|sorete|garca|chor[ro]+s?|caga(da|d[oa]|st)\\w*'),
      palabra('tarad[oa]s?|estupid[oa]s?|idiot[ao]s?|imbecil(es)?|cretin[oa]s?'),
      palabra('pajer[oa]s?|gil(es|ada)?|nabo|tonto\\s+de'),
      palabra('concha\\s+(de|tu)|verga|pija|culiad[oa]|malparid[oa]'),
    ],
  },
  {
    motivo: 'Contiene un enlace',
    patrones: [
      // Un muro que publica solo es un imán de spam. No se descarta: se
      // retiene, porque a veces el enlace es legítimo (una nota, una
      // fundación) y eso lo decide una persona.
      /https?:\/\//u,
      /\bwww\./u,
      /\b[a-z0-9-]+\.(com|net|org|ar|io|me|ly|co)\b/u,
    ],
  },
]

/**
 * Decide si un mensaje puede publicarse solo.
 *
 * Recibe varios textos porque el nombre también se publica: un insulto puesto
 * como firma sale en el muro igual que si estuviera en el cuerpo.
 */
export function revisar(...textos: string[]): Revision {
  const texto = normalizar(textos.filter(Boolean).join(' \n '))

  for (const regla of REGLAS) {
    if (regla.patrones.some((p) => p.test(texto))) {
      return { retener: true, motivo: regla.motivo }
    }
  }

  return { retener: false }
}
