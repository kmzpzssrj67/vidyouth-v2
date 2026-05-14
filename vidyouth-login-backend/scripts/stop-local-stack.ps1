# Cleanly stop the local stack started by start-local-stack.ps1.
$ErrorActionPreference = "SilentlyContinue"
$root = "c:\data collection\runtime"
$pgBin = Join-Path $root "pgsql\bin"
$pgData = Join-Path $root "pgdata"

# 1. Stop API (any node process listening on 8080).
$api = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue
if ($api) {
  Stop-Process -Id $api.OwningProcess -Force
  Write-Host "API on 8080 stopped (pid $($api.OwningProcess))." -ForegroundColor Yellow
}

# 2. Stop Redis.
Get-Process redis-server -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Redis stopped." -ForegroundColor Yellow

# 3. Stop Postgres (clean shutdown via pg_ctl).
if (Test-Path "$pgBin\pg_ctl.exe") {
  & "$pgBin\pg_ctl.exe" -D $pgData -m fast stop | Out-Null
  Write-Host "Postgres stopped." -ForegroundColor Yellow
}
Write-Host "Stack down." -ForegroundColor Green
