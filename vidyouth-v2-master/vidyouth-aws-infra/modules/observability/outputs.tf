output "sns_topic_arn" {
  value = aws_sns_topic.critical.arn
}

output "log_group_app"        { value = aws_cloudwatch_log_group.app.name }
output "log_group_alb"        { value = aws_cloudwatch_log_group.alb.name }
output "log_group_audit"      { value = aws_cloudwatch_log_group.audit.name }
output "log_group_cloudtrail" { value = aws_cloudwatch_log_group.cloudtrail.name }

output "audit_bucket_name" {
  value = aws_s3_bucket.audit.id
}

output "cloudtrail_bucket_name" {
  value = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_arn" {
  value = aws_cloudtrail.this.arn
}
