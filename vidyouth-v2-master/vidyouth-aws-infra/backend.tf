/**
 * Remote state — S3 backend with DynamoDB lock.
 *
 * The bucket and lock table are bootstrapped MANUALLY via aws CLI before
 * `terraform init` runs the first time, because the state can't store itself.
 * See: ./bootstrap-backend.ps1 in this directory.
 *
 * The {{ACCOUNT_ID}} placeholder is filled in by the bootstrap script.
 * If you bootstrap manually, replace it with your AWS account ID.
 */

terraform {
  backend "s3" {
    bucket         = "vidyouth-terraform-state-940932546129"
    key            = "prod/auth-service/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "vidyouth-terraform-locks"
    encrypt        = true
  }
}
