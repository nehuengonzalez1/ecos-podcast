# Instructivo · Cargar las variables de entorno en Vercel

Esta es la lista completa de lo que el sitio necesita para funcionar, en el orden en que
conviene cargarlo. Los valores salen de los otros dos instructivos:

- [`clerk-google-setup.md`](./clerk-google-setup.md) — login por email y Google
- [`mercadopago-setup.md`](./mercadopago-setup.md) — credenciales de pago

---

## Lo primero: el lugar correcto

**Dashboard → clic en el proyecto `ecos-podcast` → *Settings* → *Environment Variables*.**

Tiene que ser adentro del proyecto. Hay otro lugar, en la configuración del **equipo**,
con una pestaña *Shared* — y las variables cargadas ahí **no llegan al proyecto** hasta
que se las vincula una por una.

> Esto ya pasó una vez en este proyecto: las 4 variables de Clerk quedaron en *Shared*
> sin vincular, el sitio nunca las vio, y se perdieron un par de horas buscando el problema
> en otro lado. El síntoma es engañoso: **el sitio no muestra ningún error, simplemente se
> comporta como si el login no existiera.**

### Si ya hay variables cargadas en Shared

Dos opciones:

- **Vincularlas** (más rápido): en la pestaña *Shared*, menú `···` de cada variable →
  *Edit* → en **Link to Projects** elegís `ecos-podcast` → *Save*.
- **Recargarlas** en el proyecto: solo si podés ver los valores. Las marcadas como
  *Sensitive* ya no se pueden leer, así que habría que ir a buscarlas de nuevo al origen.

---

## Etapa 1 · Clerk (login)

Empezá por acá: es lo único que no requiere trámites con terceros y habilita el ingreso
por email al instante.

| Variable | Valor | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_...` (Clerk → API Keys) | ❌ No |
| `CLERK_SECRET_KEY` | `sk_...` (Clerk → API Keys) | ✅ Sí |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | ❌ No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | ❌ No |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` | ❌ No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` | ❌ No |
| `ADMIN_EMAILS` | Mails con acceso a `/admin`, separados por coma | ❌ No |
| `NEXT_PUBLIC_APP_URL` | El dominio real del sitio, sin barra final | ❌ No |

**No marques la publishable key como Sensitive.** Es pública por diseño: viaja dentro del
JavaScript que descarga cualquier visitante. Marcarla no protege nada y puede complicar el
build.

**`ADMIN_EMAILS`** se compara contra el email principal de la cuenta de Clerk. Tiene que
ser el mismo mail con el que te registrás en el sitio, o `/admin` te va a rebotar.

En **Environments**, dejá las tres tildadas (Production, Preview, Development) salvo que
tengas un motivo para separarlas.

### Verificar antes de seguir

Después del redeploy (ver el final), entrá al sitio sin estar logueado y andá a `/cuenta`:

- **Te redirige a `/sign-in`** → Clerk está andando. Seguí.
- **Carga la página igual** → Clerk sigue apagado. Revisá que las variables estén en el
  proyecto y no en Shared.

No uses el buscador del navegador sobre el código fuente para esto: si Clerk está apagado,
el sitio muestra un cartel que dice *"Configurá las credenciales de Clerk"*, y la palabra
aparece igual. Da falso positivo.

---

## Etapa 2 · Base de datos (Redis)

Sin esto se puede pagar, pero el sitio no recuerda quién está suscripto. Tampoco guarda los
mensajes del formulario "Contá tu historia".

Vercel → proyecto → *Storage* → **Marketplace** → **Upstash Redis** → conectar al proyecto.

Las variables se inyectan solas, no hay que escribirlas a mano:

```
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
```

> El README viejo dice *Storage → Create Database → KV*. **Vercel KV ya no se ofrece.**
> Upstash inyecta exactamente las mismas variables, así que el código funciona sin cambios.

---

## Etapa 3 · Mercado Pago (pagos)

Última, porque es la única que toca plata. El paso a paso para generar cada valor está en
[`mercadopago-setup.md`](./mercadopago-setup.md).

| Variable | Valor | Sensitive |
|---|---|---|
| `MP_ACCESS_TOKEN` | `APP_USR-...` (MP → Credenciales de producción) | ✅ Sí |
| `MP_WEBHOOK_SECRET` | La clave secreta que genera MP al dar de alta el webhook | ✅ Sí |
| `NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS` | Precio mensual, solo números: `1500` | ❌ No |

> 🔴 **`MP_WEBHOOK_SECRET` no es un texto inventado.** Es la clave que genera Mercado Pago.
> Con la clave correcta funciona; **vacía** funciona igual sin validar firma; pero
> **equivocada rebota todas las notificaciones y ninguna suscripción se activa nunca** —
> mientras los cobros se siguen haciendo. Vacío es más seguro que mal.

Falta un paso fuera de Vercel: dar de alta la URL del webhook en el panel de Mercado Pago,
apuntando a `https://<tu-dominio>/api/mp/webhook`, con el evento `subscription_preapproval`.

---

## Errores comunes al pegar valores

| Problema | Cómo se ve |
|---|---|
| Espacio o salto de línea al final | La clave "está cargada" pero no valida |
| Comillas alrededor del valor | Se guardan como parte del valor |
| `$1.500` en vez de `1500` | El precio se rompe o queda en el default |
| Barra final en `NEXT_PUBLIC_APP_URL` | Redirects de MP con doble barra |
| Publishable key marcada Sensitive | Innecesario; puede afectar el build |

Vercel no valida contenidos: si pegás algo mal, lo guarda igual y el error aparece después,
lejos de la causa.

---

## Al final de cada etapa: Redeploy

**Las variables no se aplican solas al sitio que ya está corriendo.**

Vercel → proyecto → *Deployments* → el de más arriba → menú `···` → **Redeploy**.

Si el proyecto está conectado a Git, también sirve cualquier push a `main`.

---

## Checklist final

- [ ] Las variables están en *Settings del proyecto*, no en *Shared* del equipo
- [ ] `/cuenta` sin loguear redirige a `/sign-in`
- [ ] Puedo registrarme, salir y volver a entrar
- [ ] `/admin` me deja entrar con el mail de `ADMIN_EMAILS`
- [ ] El formulario de contacto guarda (no da error 503)
- [ ] El botón "Suscribirme" lleva al checkout de MP con el precio correcto
- [ ] Después de pagar, la suscripción figura **activa** en Mi cuenta

Si el último falla —pagaste pero seguís sin acceso— el problema está en el webhook.
Los logs están en Vercel → *Logs*, filtrando por `mp-webhook`, y la tabla de qué significa
cada mensaje está en [`mercadopago-setup.md`](./mercadopago-setup.md).
