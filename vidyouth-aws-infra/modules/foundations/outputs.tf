output "data_kms_arn" {
  description = "KMS key for RDS / ElastiCache / EBS / app S3."
  value       = aws_kms_key.data.arn
}

output "data_kms_id" {
  value = aws_kms_key.data.key_id
}

output "secrets_kms_arn" {
  description = "KMS key for Secrets Manager."
  value       = aws_kms_key.secrets.arn
}

output "secrets_kms_id" {
  value = aws_kms_key.secrets.key_id
}

output "audit_kms_arn" {
  description = "KMS key for CloudTrail + S3 audit archive."
  value       = aws_kms_key.audit.arn
}

output "audit_kms_id" {
  value = aws_kms_key.audit.key_id
}

output "ec2_role_arn" {
  description = "IAM role ARN attached to the EC2 application instances."
  value       = aws_iam_role.ec2.arn
}

output "ec2_role_name" {
  value = aws_iam_role.ec2.name
}

output "ec2_instance_profile_name" {
  description = "IAM instance profile name for the launch template."
  value       = aws_iam_instance_profile.ec2.name
}

output "rds_monitoring_role_arn" {
  description = "Service role for RDS enhanced monitoring."
  value       = aws_iam_role.rds_monitoring.arn
}

output "flow_logs_role_arn" {
  description = "Role assumed by VPC Flow Logs to write into CloudWatch."
  value       = aws_iam_role.flow_logs.arn
}

output "events_role_arn" {
  value = aws_iam_role.events.arn
}
