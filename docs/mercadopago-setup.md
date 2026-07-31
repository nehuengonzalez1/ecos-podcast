# Instructivo · Credenciales de Mercado Pago

Guía para dejar andando las suscripciones mensuales del sitio. Son ~15 minutos.

> **Antes de empezar, una decisión que no es técnica:** el Access Token que vas a generar
> autoriza a cobrar **en la cuenta de Mercado Pago de quien lo genera**. O sea que la plata
> de las suscripciones entra ahí. Definí primero de quién es esa cuenta.

---

## Requisitos previos

- Cuenta de Mercado Pago **Argentina**, con los datos verificados (si no está verificada, MP no habilita las credenciales de producción).
- Acceso al proyecto en Vercel para cargar las variables.
- La URL del sitio en producción. En este instructivo uso `https://ecos-podcast-kohl.vercel.app` — reemplazala por la que corresponda.

---

## Paso 1 · Crear la aplicación

1. Entrá a **https://www.mercadopago.com.ar/developers/panel/app** con la cuenta que va a recibir la plata.
2. Arriba a la derecha, **Tus integraciones**.
3. **Crear aplicación**.
4. Completá:
   - **Nombre**: por ejemplo `LQLVE · Suscripciones`.
   - **¿Qué solución de pago vas a integrar?** → elegí **Suscripciones** (pagos recurrentes). Esto importa: habilita la API de *Preapproval*, que es la que usa el sitio.
   - **Modelo de integración**: sin plataforma / integración propia.
5. Guardá.

---

## Paso 2 · Sacar el Access Token de producción

1. Dentro de la aplicación, menú izquierdo: **Producción → Credenciales de producción**.
2. La primera vez te pide activarlas. Completá:
   - **Industria** (elegí la que mejor describa el proyecto)
   - **Sitio web**: la URL de producción
   - Aceptá términos y hacé el reCAPTCHA
   - **Activar credenciales de producción**
3. Van a aparecer cuatro credenciales. **Solo necesitás una: el `Access Token`.**

   | Credencial | ¿La usamos? |
   |---|---|
   | **Access Token** | ✅ Sí — es `MP_ACCESS_TOKEN` |
   | Public Key | ❌ No |
   | Client ID | ❌ No |
   | Client Secret | ❌ No |

4. Copiá el Access Token. Empieza con **`APP_USR-`** y es largo.

> ⚠️ El Access Token es una llave de caja: quien lo tiene puede generar cobros en esa cuenta.
> **No lo mandes por WhatsApp, mail ni chat.** Pegalo directo en Vercel, en un solo paso, desde
> la máquina de quien lo generó. Si alguna vez se filtra, se revoca desde este mismo panel.

---

## Paso 3 · Configurar el webhook y sacar la clave secreta

Este paso es el que hace que una suscripción pagada se active en el sitio. Sin esto, la persona paga y el sitio nunca se entera.

1. En la aplicación: **Webhooks → Configurar notificaciones**.
2. En **URL de producción**, poné exactamente:

   ```
   https://ecos-podcast-kohl.vercel.app/api/mp/webhook
   ```

3. En **Eventos**, tildá:
   - ✅ **`subscription_preapproval`** — *Vinculación de una suscripción (creación y actualización)*. **Este es obligatorio**: es el que avisa cuando alguien autoriza, pausa o cancela.
   - ✅ **`subscription_authorized_payment`** — *Pago recurrente de una suscripción*. Opcional hoy (el código todavía no lo procesa), pero conviene dejarlo tildado para no tener que volver.
   - Los demás no hacen falta.
4. **Guardar**.
5. Al guardar, MP genera una **clave secreta**. Volvé a entrar a **Webhooks → Configurar notificaciones** y copiala.

> 🔴 **El error más caro de esta guía:** `MP_WEBHOOK_SECRET` es **esta clave que genera Mercado Pago**,
> no un texto inventado por vos. El sitio valida la firma de cada notificación contra ella.
> - Clave correcta → todo funciona.
> - Variable vacía → funciona igual, sin validar firma (queda un warning en los logs).
> - **Clave inventada o equivocada → todas las notificaciones rebotan con 401 y ninguna suscripción se activa nunca.**
>
> Vacío es seguro. Equivocado es peor que vacío.

---

## Paso 4 · Cargar las variables en Vercel

**Importante:** cargalas en **Settings del proyecto**, no en las variables compartidas del equipo.
Ruta correcta: Dashboard → clic en el proyecto **`ecos-podcast`** → *Settings* → *Environment Variables*.

Si las cargás desde la configuración del **equipo** (pestaña *Shared*), quedan sin vincular al proyecto y **el sitio no las ve**. Es exactamente lo que ya pasó una vez con las claves de Clerk.

| Variable | Valor | Sensitive |
|---|---|---|
| `MP_ACCESS_TOKEN` | El `APP_USR-…` del Paso 2 | ✅ Sí |
| `MP_WEBHOOK_SECRET` | La clave secreta del Paso 3 | ✅ Sí |
| `NEXT_PUBLIC_APP_URL` | `https://ecos-podcast-kohl.vercel.app` | ❌ No |
| `NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS` | El precio mensual, solo números: `1500` | ❌ No |

Sobre `NEXT_PUBLIC_APP_URL`: de ahí sale el `back_url`, la dirección a la que Mercado Pago devuelve
al usuario después de pagar. **Si no coincide con el dominio real, la persona paga y cae en el vacío.**

Sobre `NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS`: sin puntos ni símbolos. `1500`, no `$1.500`.

> **Ignorá `MP_PREAPPROVAL_PLAN_ID`.** Aparece en `.env.example` pero el código no la usa:
> el sitio crea cada suscripción de forma directa, sin plan previo.

---

## Paso 5 · Falta la base de datos

Las suscripciones se guardan en Redis. Sin esto, alguien puede pagar pero el sitio no recuerda que está suscripto.

Vercel → proyecto → *Storage* → **Marketplace** → **Upstash Redis** → conectar al proyecto.

> El README viejo dice *Storage → Create Database → KV*. **Vercel KV ya no se ofrece.**
> Upstash inyecta las mismas variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`, así que el
> código funciona sin ningún cambio.

---

## Paso 6 · Redeploy

Las variables **no se aplican solas** al sitio que ya está corriendo.

Vercel → proyecto → *Deployments* → el de más arriba → menú `···` → **Redeploy**.

---

## Paso 7 · Verificar que quedó bien

Desde una terminal:

```bash
curl -s https://ecos-podcast-kohl.vercel.app/api/user/status
```

Sin estar logueado tiene que devolver `{"active":false,"signedIn":false}` — eso confirma que la ruta responde.

La prueba real es de punta a punta:

1. Entrá al sitio y creá una cuenta.
2. Andá a **Mi cuenta** → **Suscribirme**.
3. Tenés que caer en el checkout de Mercado Pago con el precio correcto.
4. Pagá.
5. Tenés que volver al sitio, y el estado de la suscripción tiene que figurar **activa**.
6. Entrá a `/admin` con tu mail cargado en `ADMIN_EMAILS`: la suscripción tiene que aparecer en la tabla.

Si el paso 5 falla —pagaste pero seguís sin acceso— el problema está en el webhook. Mirá los logs
en Vercel → *Logs*, filtrando por `mp-webhook`:

| Mensaje en los logs | Qué significa |
|---|---|
| `firma rechazada: signature-mismatch` | `MP_WEBHOOK_SECRET` no es la clave correcta |
| `firma rechazada: missing-x-signature` | Le está pegando algo que no es Mercado Pago |
| `MP_WEBHOOK_SECRET no configurado` | Falta la variable (funciona igual, pero sin validar) |
| Nada, ningún log | MP no está llamando: revisá la URL del Paso 3 |

---

## Probar sin plata de verdad

Si querés ensayar el flujo completo antes de salir a producción:

1. En la aplicación de MP: **Cuentas de prueba** → creá una de **vendedor** y una de **comprador**.
2. Usá las **credenciales de prueba** (el Access Token arranca con `TEST-`) en lugar de las de producción.
3. Pagá con la cuenta de prueba de comprador y las tarjetas de test que da MP.
4. Cuando funcione, cambiá el token por el de producción y hacé Redeploy.

Ojo: las credenciales de prueba y las de producción tienen **webhooks y claves secretas distintas**.
Si cambiás de una a otra, `MP_WEBHOOK_SECRET` también hay que cambiarlo.

---

## Resumen para copiar y pegar

```
MP_ACCESS_TOKEN=APP_USR-...              (Producción → Credenciales de producción)
MP_WEBHOOK_SECRET=...                    (Webhooks → Configurar notificaciones)
NEXT_PUBLIC_APP_URL=https://...          (el dominio real del sitio)
NEXT_PUBLIC_SUBSCRIPTION_PRICE_ARS=1500  (solo números)
```

Webhook: `https://<dominio>/api/mp/webhook` · evento `subscription_preapproval`
