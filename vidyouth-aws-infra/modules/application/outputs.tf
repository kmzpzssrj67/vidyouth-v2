output "ecr_repository_url" {
  value = aws_ecr_repository.auth.repository_url
}

output "ecr_repository_name" {
  value = aws_ecr_repository.auth.name
}

output "ssm_image_tag_parameter_name" {
  value = aws_ssm_parameter.image_tag.name
}

output "alb_arn" {
  value = aws_lb.app.arn
}

output "alb_dns_name" {
  description = "ALB DNS name. Hit this for /healthz once instances are healthy."
  value       = aws_lb.app.dns_name
}

output "alb_zone_id" {
  value = aws_lb.app.zone_id
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix used by CloudWatch ALB metrics."
  value       = aws_lb.app.arn_suffix
}

output "target_group_arn" {
  value = aws_lb_target_group.app.arn
}

output "target_group_arn_suffix" {
  value = aws_lb_target_group.app.arn_suffix
}

output "asg_name" {
  value = aws_autoscaling_group.app.name
}

output "launch_template_id" {
  value = aws_launch_template.app.id
}
