variable "aws_region" {
  description = "Primary AWS region for the workload."
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "Named AWS CLI profile in ~/.aws/credentials. The CLI was configured under [vidyouth]."
  type        = string
  default     = "vidyouth"
}

variable "environment" {
  description = "Environment short name. Used in tags and resource names."
  type        = string
  default     = "prod"
}

variable "name_prefix" {
  description = "Lower-case prefix for all resource names."
  type        = string
  default     = "vidyouth-prod"
}

# ---------------------------------------------------------------------------
# COST_MODE controls vertical sizing across the whole stack.
#
#   "production" → Multi-AZ, db.m6i.large, 200 GB gp3 RDS, cache.t3.small × 2,
#                  c6i.large × 2-6 EC2, 2× NAT gateway. ~$700-800/month.
#
#   "learning"   → Single-AZ, db.t3.medium, 50 GB gp3 RDS, cache.t3.small × 1,
#                  t3.medium × 2 EC2, 1× NAT gateway. ~$90/month.
#
# Modules consume this via their cost_mode input. Switching values requires
# replacement of stateful resources (RDS instance class, ElastiCache topology)
# so plan carefully when flipping in an existing environment.
# ---------------------------------------------------------------------------
variable "cost_mode" {
  description = "production | learning. Controls instance sizes and HA topology."
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "learning"], var.cost_mode)
    error_message = "cost_mode must be \"production\" or \"learning\"."
  }
}

variable "vpc_cidr" {
  description = "Primary VPC CIDR. /16 leaves room for /24 subnets."
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Apex domain for the API (e.g. vidyouth.com). Leave empty to skip Route 53 + CloudFront + ACM (the edge module)."
  type        = string
  default     = ""
}

variable "alerts_email" {
  description = "Email for CloudWatch alarm notifications. Leave empty to skip the SNS subscription."
  type        = string
  default     = ""
}

variable "auth_service_image_tag" {
  description = "Initial value for the SSM parameter holding the deployed auth-service ECR image tag."
  type        = string
  default     = "v0.0.0-placeholder"
}
