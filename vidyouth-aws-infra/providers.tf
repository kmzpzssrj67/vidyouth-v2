/**
 * Two AWS providers:
 *   - default (ap-south-1) for everything
 *   - aliased us_east_1 for resources that MUST live there:
 *       * ACM certs consumed by CloudFront
 *       * WAFv2 web ACLs scoped CLOUDFRONT
 *       * Optional billing alarms (us-east-1 is the AWS billing-metric region)
 */

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = "Vidyouth"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "auth-service"
      CostCenter  = "platform"
    }
  }
}

provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile

  default_tags {
    tags = {
      Project     = "Vidyouth"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "auth-service"
      CostCenter  = "platform"
    }
  }
}
