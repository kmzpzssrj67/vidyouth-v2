/**
 * ECR repository for the auth-service image.
 *   - immutable tags (you can't overwrite v1.2.3)
 *   - scan on push (Trivy/Inspector findings show in console)
 *   - lifecycle: keep last 30 tagged, expire untagged after 7 days
 *
 * The SSM parameter `/{prefix}/auth-image-tag` holds the *currently
 * deployed* tag. Deploys are: push image -> update SSM -> ASG instance
 * refresh -> new instances pull the new tag at boot.
 */

resource "aws_ecr_repository" "auth" {
  name                 = "${var.name_prefix}-auth-service"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = var.data_kms_arn
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-auth-service" })
}

resource "aws_ecr_lifecycle_policy" "auth" {
  repository = aws_ecr_repository.auth.name
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPatternList = ["v*"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
    ]
  })
}

# Deployment pointer: the running tag. Updated out-of-band by `aws ssm
# put-parameter` then `aws autoscaling start-instance-refresh`.
resource "aws_ssm_parameter" "image_tag" {
  name        = "/${var.name_prefix}/auth-image-tag"
  description = "Currently deployed auth-service image tag (e.g. v0.1.4)"
  type        = "String"
  value       = var.image_tag
  tags        = var.tags

  lifecycle {
    # Once it's set, deploys update it; Terraform shouldn't fight that.
    ignore_changes = [value]
  }
}
