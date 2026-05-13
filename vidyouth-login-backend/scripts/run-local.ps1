# Bring up Postgres + Redis + API locally and verify end-to-end.
# Reads JWT PEMs from ./secrets and exports them so docker compose can
# interpolate them into the api container's environment.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path .\secrets\jwt-private.pem) -or -not (Test-Path .\secrets\jwt-public.pem)) {
  Write-Host "Generating JWT RSA keypair into ./secrets ..."
  if (-not (Test-Path .\secrets)) { New-Item -ItemType Directory .\secrets | Out-Null }
  node -e "const c=require('crypto');c.generateKeyPair('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}},(e,pub,priv)=>{if(e){console.error(e);process.exit(1);}require('fs').writeFileSync('secrets/jwt-private.pem',priv);require('fs').writeFileSync('secrets/jwt-public.pem',pub);});"
}

$env:JWT_PRIVATE_KEY = Get-Content .\secrets\jwt-private.pem -Raw
$env:JWT_PUBLIC_KEY  = Get-Content .\secrets\jwt-public.pem  -Raw

Write-Host "Bringing up docker compose stack ..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed" }

Write-Host "Waiting for /livez ..."
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    $r = Invoke-WebRequest -Uri http://localhost:8080/livez -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if (-not $ok) { docker compose logs --tail 50 api; throw "API did not come up" }
Write-Host "API is live on http://localhost:8080"

Write-Host "Checking /healthz ..."
(Invoke-WebRequest -Uri http://localhost:8080/healthz -UseBasicParsing).Content
