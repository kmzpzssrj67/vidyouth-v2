variable "name_prefix" {
  description = "Lower-case prefix for resource names + secret paths."
  type        = string
}

variable "secrets_kms_arn" {
  description = "KMS key ARN used to encrypt every secret in this module."
  type        = string
}

variable "tags" {
  description = "Tags merged into every secret."
  type        = map(string)
  default     = {}
}
