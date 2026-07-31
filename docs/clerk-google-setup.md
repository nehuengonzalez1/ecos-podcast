# Instructivo · Clerk (login por email + Google)

Guía para dejar andando el ingreso de usuarios. El login por email son ~10 minutos.
Google suma ~15 más, y solo si vas a producción.

> **El código ya está listo, no hay nada que programar.** El sitio usa el componente
> `<SignIn/>` de Clerk, que muestra automáticamente los métodos que estén habilitados
> en el dashboard. Habilitar Google es un toggle, no un cambio de código.

---

## Paso 1 · Crear la aplicación en Clerk

1. Entrá a **https://clerk.com** y creá una cuenta (o entrá con la existente).
2. **Create application**.
3. Nombre: por ejemplo `LQLVE`.
4. En **Sign in options**, dejá tildado:
   - ✅ **Email address**
   - ✅ **Google** (podés tildarlo ya; en desarrollo funciona solo, ver Paso 4)
5. **Create application**.

---

## Paso 2 · Copiar las claves

Clerk te muestra las dos claves apenas creás la app. Si las cerraste: menú izquierdo → **API Keys**.

| Variable | De dónde sale | ¿Secreta? |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | *Publishable key* | No — es pública por diseño, viaja en el JavaScript del navegador |
| `CLERK_SECRET_KEY` | *Secret key* | ✅ Sí — esta no se comparte nunca |

**Mirá el prefijo, importa mucho:**

- `pk_test_…` / `sk_test_…` → **instancia de desarrollo**
- `pk_live_…` / `sk_live_…` → **instancia de producción**

Anotá cuál tenés, porque define si el Paso 4 (Google) te va a hacer falta.

> No marques la publishable key como *Sensitive* en Vercel. Es pública por diseño y
> marcarla así no protege nada.

---

## Paso 3 · Las otras variables

Además de las dos claves, el sitio espera estas. Los valores son literales, no hay que buscarlos:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

Y para el panel de administración:

```
ADMIN_EMAILS=mail1@ejemplo.com,mail2@ejemplo.com
```

Separados por coma. Solo esos mails pueden entrar a `/admin`. Se compara contra el
**email principal** de la cuenta de Clerk, así que tiene que ser el mismo con el que
te registrás en el sitio.

---

## Paso 4 · Google (solo para producción)

**Si tus claves son `pk_test_` podés saltear este paso**: en instancias de desarrollo,
Clerk usa credenciales OAuth compartidas propias y Google funciona al instante.

**Si tus claves son `pk_live_`, esto es obligatorio.** Las credenciales compartidas no
se pueden usar en producción, y el botón de Google va a fallar hasta hacer este trámite.

> ⚠️ Este es el tropiezo clásico: probás Google en desarrollo, anda perfecto, pasás a
> producción y deja de andar. No es que se rompió: nunca estuvo configurado para live.

### 4.1 · En Clerk

1. Menú izquierdo → **SSO connections** (o *Social connections*).
2. Agregá **Google** para todos los usuarios.
3. Activá **Use custom credentials**.
4. Te va a mostrar un **Authorized Redirect URI**. Copialo, lo necesitás en el próximo paso.

### 4.2 · En Google Cloud Console

1. Entrá a **https://console.cloud.google.com**.
2. Creá un proyecto (o elegí uno existente).
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
4. Tipo de aplicación: **Web application**.
5. **Authorized JavaScript origins**: el dominio del sitio, por ejemplo
   `https://ecos-podcast-kohl.vercel.app`. Si vas a probar local, agregá también
   `http://localhost:3000`.
6. **Authorized redirect URIs**: pegá el URI que te dio Clerk en 4.1. Tiene que ser
   exacto, carácter por carácter.
7. Guardá y copiá el **Client ID** y el **Client Secret**.

### 4.3 · De vuelta en Clerk

Pegá el Client ID y el Client Secret en los campos correspondientes y **Save**.

Estas dos credenciales **no** van a Vercel: quedan guardadas en Clerk.

---

## Paso 5 · Cargar en Vercel

**Cargalas en Settings del proyecto**, no en las variables compartidas del equipo.
Ruta correcta: Dashboard → clic en el proyecto **`ecos-podcast`** → *Settings* → *Environment Variables*.

Si las cargás desde la configuración del **equipo** (pestaña *Shared*), quedan sin
vincular y **el sitio no las ve**. Ya pasó una vez exactamente esto, y costó un par de
horas de confusión.

Resumen de lo que va a Vercel:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
ADMIN_EMAILS=tu@mail.com
```

Después: *Deployments* → el de más arriba → `···` → **Redeploy**. Las variables no se
aplican solas al sitio que ya está corriendo.

---

## Paso 6 · Verificar

Desde una terminal:

```bash
curl -s https://ecos-podcast-kohl.vercel.app/ | grep -c -i clerk
```

**Ojo con un falso positivo:** si Clerk está apagado, el sitio muestra un cartel que dice
*"Configurá las credenciales de Clerk"* — y esa palabra cuenta en el grep. La prueba
confiable es visual:

| Señal | Clerk apagado | Clerk andando |
|---|---|---|
| Botón del nav | "Ingreso · próximamente" | "Ingresar" |
| `/sign-in` | Cartel de "próximamente" | Formulario de Clerk |
| `/cuenta` sin loguear | Carga igual (200) | Redirige a `/sign-in` |

Ese último es el más importante: **si `/cuenta` carga sin pedirte login, Clerk sigue apagado.**

Después probá el circuito completo: registrarte, salir, volver a entrar. Y si configuraste
Google, probá ese botón específicamente — es el que falla si el Paso 4 quedó a medias.

---

## Cómo está diseñado esto (para entender qué ves)

El sitio arranca aunque no haya credenciales: `lib/env.ts` chequea si las claves existen y,
si faltan, **apaga toda la autenticación en silencio** y muestra carteles de "próximamente".

Es a propósito, para poder deployar antes de tener las cuentas listas. Pero tiene un costo
que conviene tener presente: **si una clave está mal cargada, el sitio no muestra ningún
error** — simplemente se comporta como si no existiera el login. Ante la duda, la prueba
de `/cuenta` de arriba es la que no miente.
