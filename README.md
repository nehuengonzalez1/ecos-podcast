# LQLVE · Lo que la vida esconde

Sitio storytelling + membresía mensual (Mercado Pago) construido en **Next.js 15 (App Router)** + **Clerk** (auth) + **Redis** (estado de suscripción). Deploy en Vercel.

> **Importante:** todas las cuentas externas (Clerk, Mercado Pago, base de datos)
> tienen que crearse con las credenciales del dueño del proyecto. Una versión
> anterior de este sitio se desplegó bajo otras cuentas y quedó fuera de nuestro
> control: no la uses como referencia ni reutilices sus claves.

## Activación productiva — 3 pasos

Una vez desplegado, para que auth + pagos + gating funcionen 100% necesitás inyectar 3 conjuntos de credenciales en **Vercel → Project → Settings → Environment Variables**.

### 1) Clerk (auth email + Google en 1 click)

Opción A (recomendada): **Vercel Marketplace**
- Vercel Dashboard → *Integrations* → buscar **Clerk** → Add Integration → conectar al proyecto `ecos-podcast`. Las variables se inyectan solas.

Opción B (manual): [clerk.com](https://clerk.com) → New Application → Enable Google + Email → copiar de *API Keys*:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### 2) Mercado Pago (suscripciones mensuales)

1. Entrás a [www.mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app) → *Crear aplicación* → **Suscripciones**.
2. En *Credenciales de producción* copiás el **Access Token** (empieza con `APP_USR_…`) → Vercel env:
```
MP_ACCESS_TOKEN=APP_USR_xxxxxxxxxxxx
```
3. En la app MP → *Webhooks* → Add URL:
```
https://ecos-podcast-kohl.vercel.app/api/mp/webhook
```
Si el dominio del proyecto cambia, hay que actualizar esta URL **y** la variable
`NEXT_PUBLIC_APP_URL`: de ahí salen las URLs de retorno del pago.
Eventos a suscribir: `preapproval` (obligatorio) y `subscription_preapproval` si aparece.

4. Precio (podés cambiar cuando quieras, se lee en runtime):
```
NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS=1500
```

Para testing: crear una app de test y usar `TEST-…` en `MP_ACCESS_TOKEN`. Usar usuarios de prueba de MP.

### 3) Base de datos Redis (para persistir suscripciones y mensajes)

Vercel KV está discontinuado. Ahora se usa **Upstash Redis** desde el Marketplace:

Vercel Dashboard → *Storage* → **Marketplace** → **Upstash Redis** → Connect al
proyecto. Vercel inyecta solo (los nombres `KV_*` se mantienen por compatibilidad):
```
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
```

### 4) (Opcional) Admin

Para acceso a `/admin` (dashboard con suscriptores y mensajes):
```
ADMIN_EMAILS=tu@email.com,otro@email.com
```

Después de todos los env vars, hacé un **Redeploy** desde Vercel para que tomen efecto.

## Rutas

| Ruta | Función |
|---|---|
| `/` | Home cinematográfica |
| `/archivo` | Grid de episodios con filtros + búsqueda |
| `/episodio/[slug]` | Detalle con secciones premium gated |
| `/nosotros` | Equipo |
| `/comunidad` | Stats + CTA suscripción |
| `/contacto` | Form "Contá tu historia" |
| `/gracias` | Confirmación de contacto |
| `/sign-in` · `/sign-up` | Clerk (email + Google) |
| `/cuenta` | Perfil + estado de suscripción + cancelar |
| `/admin` | Panel privado (emails en `ADMIN_EMAILS`) |

## Cómo funciona el gating

El componente `<PremiumGate>` envuelve secciones premium. Muestra el contenido borroneado con un overlay + CTA de suscripción **hasta que**:
1. El usuario esté logueado (Clerk).
2. Su registro en KV `sub:{clerkId}` tenga `active: true` — actualizado por el webhook de MP.

## Renombrar la marca

Todo en [lib/config/brand.ts](lib/config/brand.ts) — nombre, tagline, socials, copy común.

## Editar contenido

- Episodios: [data/episodes.json](data/episodes.json)
- Equipo: [data/team.json](data/team.json)
- Stats: [data/stats.json](data/stats.json)

## Stack

- **Next.js 15** (App Router, RSC)
- **React 19**
- **Tailwind 3** + Cormorant Garamond + Inter + Caveat
- **Framer Motion**
- **@clerk/nextjs** (auth + Google OAuth)
- **mercadopago v2 SDK** (Preapproval / suscripciones)
- **@vercel/kv** (Upstash Redis)
- **Lucide React** (iconos)

## Local dev

```bash
cp .env.example .env.local  # rellenar
npm install
npm run dev
```

## Deploy

Push a `master` con el repo linkeado a Vercel, o:
```bash
npx vercel deploy --prod --yes
```
