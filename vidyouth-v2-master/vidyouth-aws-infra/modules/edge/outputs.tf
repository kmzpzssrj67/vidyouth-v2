output "hosted_zone_id" {
  value = aws_route53_zone.this.zone_id
}

output "name_servers" {
  description = "Update your registrar to point at these."
  value       = aws_route53_zone.this.name_servers
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "acm_certificate_arn" {
  value = aws_acm_certificate.cf.arn
}

output "waf_web_acl_arn" {
  value = aws_wafv2_web_acl.edge.arn
}
