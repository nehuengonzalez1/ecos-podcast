# ============================================================
# ECOS — Setup automático (Windows / PowerShell)
# Corré esto DESDE ADENTRO de la carpeta ecos-podcast
# (la que descomprimiste del zip que te pasó Claude).
#
# Uso:
#   Abrí PowerShell dentro de la carpeta ecos-podcast y corré:
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# Qué hace:
#   1) Verifica Node, Git y GitHub CLI (los instala con winget si falta)
#   2) Sube el código a TU GitHub como repo privado
#   3) Instala Vercel CLI y deploya el proyecto a TU cuenta de Vercel
#
# Los únicos pasos que vas a tener que confirmar vos con un click
# son los logins (gh auth login / vercel login) — eso abre tu
# navegador para que entres con tu propia cuenta. Nadie puede
# automatizar esa parte por vos, es justamente lo que te protege.
# ============================================================

# NOTA TÉCNICA: a propósito NO usamos $ErrorActionPreference = "Stop" acá.
# Git, npm, gh y vercel escriben mensajes normales (no errores) por stderr,
# y con "Stop" activado PowerShell corta el script entero al verlos.
# En vez de eso, chequeamos $LASTEXITCODE a mano después de cada paso crítico.
$ErrorActionPreference = "Continue"

function Section($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Ok($msg)      { Write-Host "  OK - $msg" -ForegroundColor Green }
function Warn($msg)    { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Fail($msg)    { Write-Host "  X $msg" -ForegroundColor Red; exit 1 }

# --- Chequeo de carpeta correcta ---
if (-not (Test-Path "package.json") -or -not (Select-String -Path "package.json" -Pattern '"name": "ecos-podcast"' -Quiet)) {
    Fail "Este script tiene que correrse DESDE ADENTRO de la carpeta ecos-podcast (donde esta package.json)."
}

# ------------------------------------------------------------
Section "1/6 - Verificando Node.js"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "No tenes Node.js instalado. Instalando con winget..."
    winget install OpenJS.NodeJS.LTS
    Write-Host "Cerra esta ventana y volve a abrir PowerShell para que tome el PATH nuevo, despues volve a correr este script."
    exit 0
}
$nodeVersion = (node -v) -replace 'v', ''
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 20) {
    Fail "Tenes Node $nodeVersion, este proyecto necesita 20+. Actualizalo con: winget install OpenJS.NodeJS.LTS"
}
Ok "Node $(node -v)"

# ------------------------------------------------------------
Section "2/6 - Verificando Git"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Git..."
    winget install --id Git.Git -e --source winget
    Write-Host "Cerra esta ventana, volve a abrir PowerShell y volve a correr este script."
    exit 0
}
Ok "Git $(git --version)"

# ------------------------------------------------------------
Section "3/6 - Verificando GitHub CLI (gh)"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando GitHub CLI..."
    winget install --id GitHub.cli
    Write-Host "Cerra esta ventana, volve a abrir PowerShell y volve a correr este script."
    exit 0
}
Ok "GitHub CLI instalado"

# ------------------------------------------------------------
Section "4/6 - Login en GitHub (te va a pedir abrir el navegador)"
gh auth status *> $null
$ghLoggedIn = ($LASTEXITCODE -eq 0)
if ($ghLoggedIn) {
    Ok "Ya estas logueado en GitHub"
} else {
    Write-Host "Se va a abrir un flujo de login. Elegi:"
    Write-Host "  - GitHub.com"
    Write-Host "  - HTTPS"
    Write-Host "  - Login with a web browser"
    Write-Host "Y confirma el codigo que te muestre en la pagina que se abre."
    gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) { Fail "El login de GitHub no se completo. Volve a correr el script." }
}

# ------------------------------------------------------------
Section "5/6 - Subiendo el codigo a TU GitHub (repo privado 'ecos-podcast')"
if (-not (Test-Path ".git")) {
    git init
}
git add -A
git commit -m "Setup automatico" --allow-empty -q

gh repo view ecos-podcast *> $null
$repoExists = ($LASTEXITCODE -eq 0)
if ($repoExists) {
    Warn "Ya existe un repo 'ecos-podcast' en tu cuenta. Le voy a hacer push a ese."
    $username = gh api user --jq .login
    git remote remove origin *> $null
    git branch -M main
    git remote add origin "https://github.com/$username/ecos-podcast.git"
    git push -u origin main
} else {
    gh repo create ecos-podcast --private --source=. --push
}
if ($LASTEXITCODE -ne 0) { Fail "No se pudo crear/subir el repo. Revisa el mensaje de arriba." }
Ok "Repo listo en GitHub"

# ------------------------------------------------------------
Section "6/6 - Deploy a TU cuenta de Vercel"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Vercel CLI..."
    npm install -g vercel
}

vercel whoami *> $null
$vercelLoggedIn = ($LASTEXITCODE -eq 0)
if (-not $vercelLoggedIn) {
    Write-Host "Se va a abrir el login de Vercel. Elegi 'Continue with GitHub' para que quede todo conectado."
    vercel login
}

Write-Host "Instalando dependencias..."
npm install --no-audit --no-fund

Write-Host "Deployando (preview)..."
vercel --yes

Write-Host "Promoviendo a produccion..."
vercel --prod --yes

Section "Listo"
Write-Host "Tu proyecto esta en GitHub (privado, en tu cuenta) y deployado en tu propia cuenta de Vercel."
Write-Host "Anda a https://vercel.com/dashboard para ver la URL final y cargar las variables de entorno"
Write-Host "(Clerk, Mercado Pago, KV) cuando las tengas - el sitio funciona igual sin ellas, en modo degradado."
