/**
 * 5 CloudWatch log groups:
 *
 *   /{prefix}/auth-service       app stdout/stderr (30 / 7 days)
 *   /{prefix}/alb                ALB access logs (30 / 7 days)
 *   /{prefix}/audit              long-term audit (7 years — compliance)
 *   /aws/cloudtrail/{prefix}     CloudTrail backing log group (365 days)
 *
 * VPC flow logs already created in the networking module.
 */

locals {
  is_production = var.cost_mode == "production"
  retention_days_app = local.is_production ? 30 : 7
  audit_retention_days = 2557 # 7 years for financial / login audit
  cloudtrail_retention_days = 365
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.name_prefix}/auth-service"
  retention_in_days = local.retention_days_app
  kms_key_id        = var.data_kms_arn
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/${var.name_prefix}/alb"
  retention_in_days = local.retention_days_app
  kms_key_id        = var.data_kms_arn
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "audit" {
  name              = "/${var.name_prefix}/audit"
  retention_in_days = local.audit_retention_days
  kms_key_id        = var.audit_kms_arn
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.name_prefix}"
  retention_in_days = local.cloudtrail_retention_days
  kms_key_id        = var.audit_kms_arn
  tags              = var.tags
}
