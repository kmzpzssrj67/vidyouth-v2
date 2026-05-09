/**
 * Root outputs. Sensitive endpoints are flagged so plan/apply tables don't
 * echo them.
 */

# Account info
output "aws_account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS account this stack is deployed into."
}
output "aws_region" {
  value = data.aws_region.current.name
}
output "cost_mode" {
  value = var.cost_mode
}

# Foundations
output "data_kms_arn"    { value = module.foundations.data_kms_arn }
output "secrets_kms_arn" { value = module.foundations.secrets_kms_arn }
output "audit_kms_arn"   { value = module.foundations.audit_kms_arn }
output "ec2_role_arn"    { value = module.foundations.ec2_role_arn }

# Networking
output "vpc_id"                  { value = module.networking.vpc_id }
output "vpc_cidr"                { value = module.networking.vpc_cidr }
output "public_subnet_ids"       { value = module.networking.public_subnet_ids }
output "private_app_subnet_ids"  { value = module.networking.private_app_subnet_ids }
output "private_data_subnet_ids" { value = module.networking.private_data_subnet_ids }
output "alb_security_group_id"   { value = module.networking.alb_security_group_id }
output "ec2_security_group_id"   { value = module.networking.ec2_security_group_id }
output "rds_security_group_id"   { value = module.networking.rds_security_group_id }
output "redis_security_group_id" { value = module.networking.redis_security_group_id }
output "nat_gateway_count"       { value = module.networking.nat_gateway_count }

# Secrets — names only.
output "db_master_password_secret_name" { value = module.secrets.db_master_password_name }

# Data
output "rds_endpoint" {
  value     = module.data.rds_endpoint
  sensitive = true
}
output "rds_port"    { value = module.data.rds_port }
output "rds_db_name" { value = module.data.rds_db_name }
output "redis_primary_endpoint" {
  value     = module.data.redis_primary_endpoint
  sensitive = true
}
output "redis_port" { value = module.data.redis_port }

# Application
output "ecr_repository_url"           { value = module.application.ecr_repository_url }
output "ssm_image_tag_parameter_name" { value = module.application.ssm_image_tag_parameter_name }
output "alb_dns_name"                 { value = module.application.alb_dns_name }
output "alb_zone_id"                  { value = module.application.alb_zone_id }
output "asg_name"                     { value = module.application.asg_name }

# Observability
output "alerts_sns_topic_arn"  { value = module.observability.sns_topic_arn }
output "audit_bucket_name"     { value = module.observability.audit_bucket_name }
output "cloudtrail_bucket_name" { value = module.observability.cloudtrail_bucket_name }

# Edge — only present when domain_name is set
output "cloudfront_distribution_id" {
  value = length(module.edge) > 0 ? module.edge[0].cloudfront_distribution_id : null
}
output "edge_name_servers" {
  description = "Update your domain registrar to point here once a domain is configured."
  value       = length(module.edge) > 0 ? module.edge[0].name_servers : null
}
