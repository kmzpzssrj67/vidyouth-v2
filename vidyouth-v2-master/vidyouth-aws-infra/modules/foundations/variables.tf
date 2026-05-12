variable "name_prefix" {
  description = "Lower-case prefix for resource names (e.g. vidyouth-prod)."
  type        = string
}

variable "account_id" {
  description = "AWS account ID this stack is being applied into."
  type        = string
}

variable "tags" {
  description = "Tags merged into every resource."
  type        = map(string)
  default     = {}
}
