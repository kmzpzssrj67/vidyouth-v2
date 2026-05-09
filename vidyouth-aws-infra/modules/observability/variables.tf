variable "name_prefix"   { type = string }
variable "cost_mode"     { type = string }
variable "data_kms_arn"  { type = string }
variable "audit_kms_arn" { type = string }

variable "alerts_email" {
  description = "Email to subscribe to the critical alarm SNS topic. Empty = no email subscription."
  type        = string
  default     = ""
}

variable "alb_arn_suffix"          { type = string }
variable "target_group_arn_suffix" { type = string }
variable "rds_instance_id"         { type = string }
variable "redis_replication_group_id" { type = string }
variable "asg_name"                { type = string }

variable "tags" {
  type    = map(string)
  default = {}
}
