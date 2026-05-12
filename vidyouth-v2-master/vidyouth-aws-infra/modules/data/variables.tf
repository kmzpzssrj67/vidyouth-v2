variable "name_prefix" { type = string }
variable "cost_mode"   { type = string }

variable "data_subnet_ids" {
  description = "Private data-tier subnet IDs for the DB + Redis subnet groups (>=2 across AZs)."
  type        = list(string)
}

variable "rds_security_group_id"   { type = string }
variable "redis_security_group_id" { type = string }
variable "data_kms_arn"            { type = string }

variable "db_password_secret_arn" {
  description = "Secrets Manager ARN holding the master DB password."
  type        = string
}

variable "redis_auth_secret_arn" {
  description = "Secrets Manager ARN holding the Redis AUTH token."
  type        = string
}

variable "monitoring_role_arn" {
  description = "RDS enhanced-monitoring role ARN from foundations."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
