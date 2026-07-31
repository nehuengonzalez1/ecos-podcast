export const brand = {
  name: 'LQLVE',
  tagline: 'Historias que quedan',
  fullName: 'Lo que la vida esconde',
  slogan: 'Historias que cambian vidas, algunas todavía no fueron contadas',
  description:
    'Un espacio donde las historias se cuentan con respeto, profundidad y verdad.',
  city: 'Buenos Aires, Argentina',
  emailContact: 'info@lqlve.com.ar',
  socials: {
    youtube: 'https://www.youtube.com/@LoQueLaVidaEsconde',
    instagram: 'https://www.instagram.com/lqlve.podcast/',
    tiktok: 'https://www.tiktok.com/@loquelavidaesconde',
    spotify: 'https://open.spotify.com/show/033G2Sw489gxBxEgGbVUUJ',
  },
  cta: {
    subscribe: 'Suscribite',
    tellStory: 'Contá tu historia',
    exploreArchive: 'Entrar al archivo',
  },
} as const

export type Brand = typeof brand
