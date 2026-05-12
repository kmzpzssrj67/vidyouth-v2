/**
 * Secrets Manager — 8 secrets, each KMS-encrypted with the secrets key.
 *
 *   db-master-password         random 32-char string
 *   db-app-password            random 32-char string (separate from master)
 *   redis-auth-token           random 64-char string (ElastiCache requires
 *                              alphanumeric only; no symbols)
 *   jwt-private-key            RSA 4096-bit PKCS#8 PEM (this module generates)
 *   jwt-public-key             matching SPKI PEM
 *   bcrypt-pepper              random 64-char string
 *   msg91-api-key              placeholder; update via aws secretsmanager later
 *   ses-smtp-credentials       placeholder JSON; update later
 *
 * NOTE: Terraform state will hold these values. The S3 state backend is
 * KMS-encrypted, but anyone with read on the bucket can read the values.
 * Restrict bucket access tightly (we already do — public access blocked,
 * IAM scopes the bucket to admin users only).
 */

# ─── random material ────────────────────────────────────────────────────────
resource "random_password" "db_master" {
  length  = 32
  special = true
  # Postgres dislikes a few chars in connection strings; exclude them.
  override_special = "!@#$%^&*()-_=+[]{}<>?"
}

resource "random_password" "db_app" {
  length           = 32
  special          = true
  override_special = "!@#$%^&*()-_=+[]{}<>?"
}

resource "random_password" "redis_auth" {
  length  = 64
  special = false # ElastiCache requires alphanumeric AUTH tokens
}

resource "random_password" "bcrypt_pepper" {
  length  = 64
  special = false
}

resource "tls_private_key" "jwt" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# ─── Secrets Manager resources ───────────────────────────────────────────────
locals {
  secret_paths = {
    db_master_password = "${var.name_prefix}/db-master-password"
    db_app_password    = "${var.name_prefix}/db-app-password"
    redis_auth_token   = "${var.name_prefix}/redis-auth-token"
    jwt_private_key    = "${var.name_prefix}/jwt-private-key"
    jwt_public_key     = "${var.name_prefix}/jwt-public-key"
    bcrypt_pepper      = "${var.name_prefix}/bcrypt-pepper"
    msg91_api_key      = "${var.name_prefix}/msg91-api-key"
    ses_smtp           = "${var.name_prefix}/ses-smtp-credentials"
  }
}

# 1. db master password
resource "aws_secretsmanager_secret" "db_master_password" {
  name        = local.secret_paths.db_master_password
  description = "RDS master user password"
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id     = aws_secretsmanager_secret.db_master_password.id
  secret_string = random_password.db_master.result
}

# 2. db application password
resource "aws_secretsmanager_secret" "db_app_password" {
  name        = local.secret_paths.db_app_password
  description = "RDS application user password (least-privileged)"
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "db_app_password" {
  secret_id     = aws_secretsmanager_secret.db_app_password.id
  secret_string = random_password.db_app.result
}

# 3. redis AUTH token
resource "aws_secretsmanager_secret" "redis_auth_token" {
  name        = local.secret_paths.redis_auth_token
  description = "ElastiCache Redis AUTH token"
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth.result
}

# 4. JWT private key (PKCS#8 PEM)
resource "aws_secretsmanager_secret" "jwt_private_key" {
  name        = local.secret_paths.jwt_private_key
  description = "RS256 private key for signing JWTs"
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "jwt_private_key" {
  secret_id     = aws_secretsmanager_secret.jwt_private_key.id
  secret_string = tls_private_key.jwt.private_key_pem_pkcs8
}

# 5. JWT public key (SPKI PEM)
resource "aws_secretsmanager_secret" "jwt_public_key" {
  name        = local.secret_paths.jwt_public_key
  description = "RS256 public key for verifying JWTs"
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "jwt_public_key" {
  secret_id     = aws_secretsmanager_secret.jwt_public_key.id
  secret_string = tls_private_key.jwt.public_key_pem
}

# 6. bcrypt pepper
resource "aws_secretsmanager_secret" "bcrypt_pepper" {
  name        = local.secret_paths.bcrypt_pepper
  description = "Server-side bcrypt pepper, applied to every password before hashing"
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "bcrypt_pepper" {
  secret_id     = aws_secretsmanager_secret.bcrypt_pepper.id
  secret_string = random_password.bcrypt_pepper.result
}

# 7. MSG91 API key (placeholder — set the real one with `aws secretsmanager put-secret-value`)
resource "aws_secretsmanager_secret" "msg91_api_key" {
  name        = local.secret_paths.msg91_api_key
  description = "MSG91 SMS provider API key. Replace with real value via aws CLI."
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "msg91_api_key" {
  secret_id     = aws_secretsmanager_secret.msg91_api_key.id
  secret_string = "PLACEHOLDER_REPLACE_AFTER_APPLY"

  lifecycle {
    # Ignore drift here — the real value is set out-of-band via aws CLI.
    ignore_changes = [secret_string]
  }
}

# 8. SES SMTP credentials (placeholder JSON object)
resource "aws_secretsmanager_secret" "ses_smtp" {
  name        = local.secret_paths.ses_smtp
  description = "SES SMTP credentials JSON. Replace via aws CLI after IAM user creation."
  kms_key_id  = var.secrets_kms_arn
  recovery_window_in_days = 7
  tags        = var.tags
}
resource "aws_secretsmanager_secret_version" "ses_smtp" {
  secret_id     = aws_secretsmanager_secret.ses_smtp.id
  secret_string = jsonencode({
    smtpUsername = "PLACEHOLDER"
    smtpPassword = "PLACEHOLDER"
    smtpHost     = "email-smtp.ap-south-1.amazonaws.com"
    smtpPort     = 587
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
