param(
  [Parameter(Mandatory = $true)]
  [string]$FileName,

  [string]$Container = "vidyouth-postgres",
  [string]$Database = "vidyouth_lms",
  [string]$User = "vidyouth"
)

$ErrorActionPreference = "Stop"

Write-Host "Applying migration $FileName to $Database in container $Container..."
docker exec $Container psql -U $User -d $Database -f "/docker-entrypoint-initdb.d/$FileName"

Write-Host ""
Write-Host "Migration applied. Current users phone-auth schema:"
docker exec $Container psql -U $User -d $Database -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('phone_number','phone_verified_at') ORDER BY column_name;"

Write-Host ""
Write-Host "Phone-auth indexes:"
docker exec $Container psql -U $User -d $Database -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'users' AND indexname LIKE 'users_phone%';"
