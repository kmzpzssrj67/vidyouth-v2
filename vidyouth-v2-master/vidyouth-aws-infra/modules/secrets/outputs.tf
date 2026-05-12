output "db_master_password_arn" {
  value = aws_secretsmanager_secret.db_master_password.arn
}

output "db_master_password_name" {
  value = aws_secretsmanager_secret.db_master_password.name
}

output "db_app_password_arn" {
  value = aws_secretsmanager_secret.db_app_password.arn
}

output "redis_auth_token_arn" {
  value = aws_secretsmanager_secret.redis_auth_token.arn
}

output "jwt_private_key_arn" {
  value = aws_secretsmanager_secret.jwt_private_key.arn
}

output "jwt_public_key_arn" {
  value = aws_secretsmanager_secret.jwt_public_key.arn
}

output "bcrypt_pepper_arn" {
  value = aws_secretsmanager_secret.bcrypt_pepper.arn
}

output "msg91_api_key_arn" {
  value = aws_secretsmanager_secret.msg91_api_key.arn
}

output "ses_smtp_arn" {
  value = aws_secretsmanager_secret.ses_smtp.arn
}
