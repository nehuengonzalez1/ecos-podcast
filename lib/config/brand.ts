export const brand = {
  name: 'LQLVE',
  tagline: 'Historias que quedan',
  fullName: 'Lo que la vida esconde',
  slogan: 'Historias que cambian vidas, algunas todavía no fueron contadas',
  description:
    'Un espacio donde las historias se cuentan con respeto, profundidad y verdad.',
  city: 'Buenos Aires, Argentina',
  emailContact: 'hola@ecos-podcast.com',
  socials: {
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/',
    spotify: 'https://open.spotify.com/',
    tiktok: 'https://tiktok.com/',
    x: 'https://x.com/',
  },
  cta: {
    subscribe: 'Suscribite',
    tellStory: 'Contá tu historia',
    exploreArchive: 'Entrar al archivo',
  },
} as const

export type Brand = typeof brand
