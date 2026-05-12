variable "name_prefix" { type = string }
variable "cost_mode"   { type = string }

variable "vpc_id"                 { type = string }
variable "public_subnet_ids"      { type = list(string) }
variable "private_app_subnet_ids" { type = list(string) }

variable "alb_security_group_id" { type = string }
variable "ec2_security_group_id" { type = string }

variable "ec2_instance_profile_name" { type = string }
variable "data_kms_arn"              { type = string }

variable "image_tag" {
  description = "Initial value for the SSM parameter holding the deployed ECR image tag."
  type        = string
  default     = "v0.0.0-placeholder"
}

variable "tags" {
  type    = map(string)
  default = {}
}
