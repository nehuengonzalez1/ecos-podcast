#!/usr/bin/env bash
# ============================================================
# ECOS — Setup automático (Mac / Linux)
# Corré esto DESDE ADENTRO de la carpeta ecos-podcast
# (la que descomprimiste del zip que te pasó Claude).
#
# Uso:
#   chmod +x setup.sh
#   ./setup.sh
#
# Qué hace:
#   1) Verifica Node, Git y GitHub CLI (los instala si podés/falta)
#   2) Sube el código a TU GitHub como repo privado
#   3) Instala Vercel CLI y deploya el proyecto a TU cuenta de Vercel
#
# Los únicos pasos que vas a tener que confirmar vos con un click
# son los logins (gh auth login / vercel login) — eso abre tu
# navegador para que entres con tu propia cuenta. Nadie puede
# automatizar esa parte por vos, es justamente lo que te protege.
# ============================================================

set -e

bold() { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  ✓ %s\n" "$1"; }
warn() { printf "  ⚠ %s\n" "$1"; }

# --- Chequeo de carpeta correcta ---
if [ ! -f "package.json" ] || ! grep -q '"name": "ecos-podcast"' package.json; then
  echo "❌ Este script tiene que correrse DESDE ADENTRO de la carpeta ecos-podcast (donde está package.json)."
  exit 1
fi

# ------------------------------------------------------------
bold "1/6 — Verificando Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "❌ No tenés Node.js instalado."
  if command -v brew >/dev/null 2>&1; then
    echo "Instalando con Homebrew..."
    brew install node
  else
    echo "Instalá Homebrew primero (https://brew.sh) o bajá Node de https://nodejs.org y volvé a correr este script."
    exit 1
  fi
fi
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Tenés Node $(node -v), este proyecto necesita 20+. Actualizalo (brew install node) y volvé a correr el script."
  exit 1
fi
ok "Node $(node -v)"

# ------------------------------------------------------------
bold "2/6 — Verificando Git"
if ! command -v git >/dev/null 2>&1; then
  echo "Instalando git..."
  brew install git
fi
ok "Git $(git --version | awk '{print $3}')"

# ------------------------------------------------------------
bold "3/6 — Verificando GitHub CLI (gh)"
if ! command -v gh >/dev/null 2>&1; then
  echo "Instalando GitHub CLI..."
  if command -v brew >/dev/null 2>&1; then
    brew install gh
  else
    echo "❌ Necesitás Homebrew para instalar gh automáticamente. Instalalo de https://brew.sh"
    exit 1
  fi
fi
ok "GitHub CLI $(gh --version | head -1)"

# ------------------------------------------------------------
bold "4/6 — Login en GitHub (acá te va a pedir abrir el navegador)"
if gh auth status >/dev/null 2>&1; then
  ok "Ya estás logueado en GitHub como $(gh api user --jq .login 2>/dev/null || echo '(usuario actual)')"
else
  echo "Se va a abrir un flujo de login. Elegí:"
  echo "  - GitHub.com"
  echo "  - HTTPS"
  echo "  - Login with a web browser"
  echo "Y confirmá el código que te muestre en la página que se abre."
  gh auth login --hostname github.com --git-protocol https --web
fi

# ------------------------------------------------------------
bold "5/6 — Subiendo el código a TU GitHub (repo privado 'ecos-podcast')"
if [ ! -d ".git" ]; then
  git init
fi
git add -A
git commit -m "Setup automático" --allow-empty -q

if gh repo view ecos-podcast >/dev/null 2>&1; then
  warn "Ya existe un repo 'ecos-podcast' en tu cuenta. Le voy a hacer push a ese."
  git remote remove origin 2>/dev/null || true
  gh repo set-default "$(gh api user --jq .login)/ecos-podcast" 2>/dev/null || true
  git branch -M main
  git remote add origin "https://github.com/$(gh api user --jq .login)/ecos-podcast.git"
  git push -u origin main
else
  gh repo create ecos-podcast --private --source=. --push
fi
ok "Repo listo en GitHub"

# ------------------------------------------------------------
bold "6/6 — Deploy a TU cuenta de Vercel"
if ! command -v vercel >/dev/null 2>&1; then
  echo "Instalando Vercel CLI..."
  npm install -g vercel
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "Se va a abrir el login de Vercel. Elegí 'Continue with GitHub' para que quede todo conectado."
  vercel login
fi

echo "Instalando dependencias..."
npm install --no-audit --no-fund

echo "Deployando (preview)..."
vercel --yes

echo "Promoviendo a producción..."
vercel --prod --yes

bold "✅ Listo"
echo "Tu proyecto está en GitHub (privado, en tu cuenta) y deployado en tu propia cuenta de Vercel."
echo "Andá a https://vercel.com/dashboard para ver la URL final y cargar las variables de entorno"
echo "(Clerk, Mercado Pago, KV) cuando las tengas — el sitio funciona igual sin ellas, en modo degradado."
