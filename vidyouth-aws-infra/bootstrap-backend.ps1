<#
.SYNOPSIS
  One-time bootstrap of the Terraform S3 + DynamoDB remote state backend.

.DESCRIPTION
  Creates:
    - vidyouth-terraform-state-<account-id> S3 bucket (versioned, AES256, public-blocked)
    - vidyouth-terraform-locks  DynamoDB table (PAY_PER_REQUEST, hash key LockID)
  Then patches backend.tf with the resolved bucket name. Idempotent.

.PARAMETER Profile
  Named CLI profile. Defaults to AWS_PROFILE env var, then "vidyouth".

.USAGE
  pwsh ./bootstrap-backend.ps1
  pwsh ./bootstrap-backend.ps1 -Profile myprof
#>

param(
  [string]$Profile = $(if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { 'vidyouth' })
)

$ErrorActionPreference = 'Stop'

$awsExe = (Get-Command aws -ErrorAction SilentlyContinue).Source
if (-not $awsExe) { $awsExe = "C:\Program Files\Amazon\AWSCLIV2\aws.exe" }
if (-not (Test-Path $awsExe)) { throw "aws CLI not found. Install AWS CLI v2 first." }

Write-Host "[1/8] Using AWS CLI profile: $Profile"
Write-Host "[2/8] Resolving AWS account ID..."
$identityRaw = & $awsExe sts get-caller-identity --profile $Profile --output json
if ($LASTEXITCODE -ne 0) { throw "aws sts get-caller-identity failed for profile '$Profile'. Run 'aws configure --profile $Profile' first." }
$identity = $identityRaw | ConvertFrom-Json
$accountId = $identity.Account
$region    = "ap-south-1"
$bucket    = "vidyouth-terraform-state-$accountId"
$lockTable = "vidyouth-terraform-locks"

Write-Host "      account = $accountId"
Write-Host "      region  = $region"
Write-Host "      bucket  = $bucket"
Write-Host "      lockTbl = $lockTable"

# --- S3 bucket -------------------------------------------------------------
$bucketExists = $false
$null = & $awsExe s3api head-bucket --bucket $bucket --profile $Profile 2>$null
if ($LASTEXITCODE -eq 0) { $bucketExists = $true }

if (-not $bucketExists) {
  Write-Host "[3/8] Creating S3 bucket $bucket..."
  & $awsExe s3api create-bucket `
    --bucket $bucket `
    --region $region `
    --profile $Profile `
    --create-bucket-configuration "LocationConstraint=$region" | Out-Null
  Write-Host "      bucket created."
} else {
  Write-Host "[3/8] S3 bucket $bucket already exists (reusing)."
}

Write-Host "[4/8] Enabling versioning..."
& $awsExe s3api put-bucket-versioning `
  --bucket $bucket `
  --profile $Profile `
  --versioning-configuration "Status=Enabled" | Out-Null

Write-Host "[5/8] Enabling default encryption (AES256)..."
$encJson = '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'
& $awsExe s3api put-bucket-encryption `
  --bucket $bucket `
  --profile $Profile `
  --server-side-encryption-configuration $encJson | Out-Null

Write-Host "[6/8] Blocking all public access..."
& $awsExe s3api put-public-access-block `
  --bucket $bucket `
  --profile $Profile `
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" | Out-Null

# --- DynamoDB lock table ---------------------------------------------------
$tableExists = $false
$null = & $awsExe dynamodb describe-table --table-name $lockTable --region $region --profile $Profile 2>$null
if ($LASTEXITCODE -eq 0) { $tableExists = $true }

if (-not $tableExists) {
  Write-Host "[7/8] Creating DynamoDB lock table $lockTable..."
  & $awsExe dynamodb create-table `
    --table-name $lockTable `
    --region $region `
    --profile $Profile `
    --attribute-definitions "AttributeName=LockID,AttributeType=S" `
    --key-schema "AttributeName=LockID,KeyType=HASH" `
    --billing-mode PAY_PER_REQUEST `
    --tags "Key=Project,Value=Vidyouth" "Key=ManagedBy,Value=Terraform" | Out-Null

  Write-Host "      waiting for table to become ACTIVE..."
  & $awsExe dynamodb wait table-exists --table-name $lockTable --region $region --profile $Profile | Out-Null
  Write-Host "      table ready."
} else {
  Write-Host "[7/8] DynamoDB lock table $lockTable already exists (reusing)."
}

# --- Patch backend.tf ------------------------------------------------------
Write-Host "[8/8] Patching backend.tf with bucket name..."
$backendPath = Join-Path $PSScriptRoot 'backend.tf'
if (-not (Test-Path $backendPath)) { throw "backend.tf not found at $backendPath" }

$content = [System.IO.File]::ReadAllText($backendPath, [System.Text.Encoding]::UTF8)
$content = $content -replace 'vidyouth-terraform-state-\{\{ACCOUNT_ID\}\}', $bucket
$content = $content -replace 'vidyouth-terraform-state-\d+', $bucket
[System.IO.File]::WriteAllText($backendPath, $content, (New-Object System.Text.UTF8Encoding $false))

Write-Host ""
Write-Host "Bootstrap complete."
Write-Host "  bucket          = $bucket"
Write-Host "  versioning      = Enabled"
Write-Host "  lock table      = $lockTable"
Write-Host "  backend.tf      = patched"
Write-Host ""
Write-Host "Next: terraform init"
