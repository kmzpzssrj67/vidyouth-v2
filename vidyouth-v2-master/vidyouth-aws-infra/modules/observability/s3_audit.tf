/**
 * Long-term audit archive bucket. Object-Lock at COMPLIANCE mode for 730
 * days = tamper-evident even by account admins (the deck's "passes external
 * review" claim).
 *
 * Lifecycle: hot in S3 Standard for the first 365 days, then transition to
 * GLACIER_DEEP_ARCHIVE.
 */

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "audit" {
  bucket              = "${var.name_prefix}-audit-archive"
  object_lock_enabled = true
  force_destroy       = !local.is_production # learning mode allows tear-down

  tags = merge(var.tags, { Name = "${var.name_prefix}-audit-archive" })
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 730
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.audit_kms_arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket                  = aws_s3_bucket.audit.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    id     = "transition-to-deep-archive"
    status = "Enabled"

    filter {
      prefix = "audit/"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}
