variable "name_prefix" {
  description = "Lower-case prefix for resource names."
  type        = string
}

variable "vpc_cidr" {
  description = "Primary VPC CIDR. /16 leaves room for /24 subnets."
  type        = string
  default     = "10.0.0.0/16"
}

variable "cost_mode" {
  description = "production = 2 NAT gateways (one per AZ). learning = 1 NAT gateway shared by both AZs."
  type        = string
  default     = "production"
}

variable "flow_logs_role_arn" {
  description = "IAM role ARN that VPC Flow Logs will assume to write into CloudWatch."
  type        = string
}

variable "tags" {
  description = "Tags merged into every resource."
  type        = map(string)
  default     = {}
}
