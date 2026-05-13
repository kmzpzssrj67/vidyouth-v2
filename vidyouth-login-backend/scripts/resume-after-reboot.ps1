# Step 2 of 2: After WSL+Docker reboot, this brings the whole stack live.
# Run from a NORMAL (non-admin) PowerShell window:
#
#   cd "c:\data collection\vidyouth-login-backend"
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\scripts\resume-after-reboot.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1. Wait for Docker Desktop to be ready.
Write-Host "Waiting for Docker Desktop daemon..." -ForegroundColor Cyan
for ($i = 0; $i -lt 60; $i++) {
  try {
    docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
  } catch {}
  Start-Sleep -Seconds 3
}
docker info --format "Docker server: {{.ServerVersion}}"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker is still not ready. Open Docker Desktop manually, wait for the whale to settle, then re-run." -ForegroundColor Red
  exit 1
}

# 2. Make sure JWT keys exist; if not, generate them.
if (-not (Test-Path .\secrets\jwt-private.pem) -or -not (Test-Path .\secrets\jwt-public.pem)) {
  Write-Host "Generating JWT RSA keypair into ./secrets ..." -ForegroundColor Cyan
  if (-not (Test-Path .\secrets)) { New-Item -ItemType Directory .\secrets | Out-Null }
  node -e "const c=require('crypto');c.generateKeyPair('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}},(e,pub,priv)=>{if(e){console.error(e);process.exit(1);}require('fs').writeFileSync('secrets/jwt-private.pem',priv);require('fs').writeFileSync('secrets/jwt-public.pem',pub);});"
}

# 3. Export PEMs as host env vars so docker compose can interpolate them.
$env:JWT_PRIVATE_KEY = Get-Content .\secrets\jwt-private.pem -Raw
$env:JWT_PUBLIC_KEY  = Get-Content .\secrets\jwt-public.pem  -Raw

# 4. Bring the stack up.
Write-Host "docker compose up -d --build (Postgres + Redis + API) ..." -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { docker compose logs --tail 40 api; throw "docker compose up failed" }

# 5. Wait for /livez.
Write-Host "Waiting for API /livez ..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 90; $i++) {
  try {
    $r = Invoke-WebRequest -Uri http://localhost:8080/livez -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if (-not $ok) { docker compose logs --tail 80 api; throw "API did not come up" }

Write-Host "API is LIVE on http://localhost:8080" -ForegroundColor Green

# 6. Hit /healthz and /auth/signup as smoke tests.
Write-Host ""
Write-Host "GET /healthz" -ForegroundColor Cyan
(Invoke-WebRequest -Uri http://localhost:8080/healthz -UseBasicParsing).Content

Write-Host ""
Write-Host "POST /auth/signup (demo user)" -ForegroundColor Cyan
$signupBody = @{
  displayName = "Demo User"
  password    = "TestPass123"
  channel     = "email"
  email       = "demo+$([int](Get-Date -UFormat %s))@vidyouth.local"
} | ConvertTo-Json
try {
  $r = Invoke-WebRequest -Uri http://localhost:8080/auth/signup -Method POST -Body $signupBody -ContentType "application/json" -UseBasicParsing
  Write-Host "HTTP $($r.StatusCode)"
  $r.Content
} catch {
  Write-Host "signup error: $($_.Exception.Message)" -ForegroundColor Yellow
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  }
}

Write-Host ""
Write-Host "Now open 'c:\data collection\login.html' in your browser." -ForegroundColor Green
Write-Host "The API status pill at the bottom of the card should turn GREEN."
