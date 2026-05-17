# Step 1 of 2: Install WSL2 (needed by Docker Desktop on Windows 11 Home).
# Run this from a NEW PowerShell window opened as Administrator:
#
#   1. Press Start, type "PowerShell", right-click → "Run as administrator"
#   2. cd "c:\data collection\vidyouth-login-backend"
#   3. Set-ExecutionPolicy -Scope Process Bypass -Force
#   4. .\scripts\install-wsl-then-docker.ps1
#
# This will install WSL2, ask Windows to reboot, and after reboot you run
# .\scripts\resume-after-reboot.ps1 (does NOT need admin).

$ErrorActionPreference = "Stop"

$elevated = ([Security.Principal.WindowsPrincipal] `
  [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $elevated) {
  Write-Host "This script must be run from an elevated (Run as administrator) PowerShell window." -ForegroundColor Red
  Write-Host "Press Start, type PowerShell, right-click -> Run as administrator, then re-run this script."
  exit 1
}

Write-Host "Installing WSL2 + Ubuntu (this can take a few minutes)..." -ForegroundColor Cyan
wsl --install --no-launch
if ($LASTEXITCODE -ne 0) {
  Write-Host "wsl --install failed. If it says 'already installed', run: wsl --update" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "WSL install initiated. Windows must reboot to finish." -ForegroundColor Green
Write-Host "After the reboot:" -ForegroundColor Green
Write-Host "  1. Docker Desktop should auto-launch (or open it from Start menu)."
Write-Host "  2. Wait until the Docker whale icon stops animating."
Write-Host "  3. Open PowerShell (NORMAL, not admin) and run:"
Write-Host "       cd 'c:\data collection\vidyouth-login-backend'"
Write-Host "       .\scripts\resume-after-reboot.ps1"
Write-Host ""
$ans = Read-Host "Reboot now? (y/N)"
if ($ans -eq 'y' -or $ans -eq 'Y') {
  Restart-Computer
}
