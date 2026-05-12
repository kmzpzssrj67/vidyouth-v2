/**
 * Three customer-managed KMS keys, all with annual rotation enabled and
 * a "deny everything that's not explicitly allowed" key policy that scopes
 * decrypt to the AWS service principals that need it.
 *
 *   data    → RDS, ElastiCache, EBS, CloudWatch Logs, S3 application data
 *   secrets → Secrets Manager
 *   audit   → CloudTrail S3 bucket + S3 audit archive
 */

# ─── data key ────────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "data_key_policy" {
  # 1. Root-account full control (account-owner break-glass)
  statement {
    sid     = "RootAccount"
    actions = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.account_id}:root"]
    }
  }

  # 2. AWS services that consume the key
  statement {
    sid = "ServiceUsage"
    actions = [
      "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
      "kms:GenerateDataKey*", "kms:DescribeKey",
    ]
    resources = ["*"]
    principals {
      type = "Service"
      identifiers = [
        "rds.amazonaws.com",
        "elasticache.amazonaws.com",
        "ec2.amazonaws.com",
        "logs.${data.aws_region.current.name}.amazonaws.com",
        "s3.amazonaws.com",
      ]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.account_id]
    }
  }

  # 3. Grant creation for things like RDS automated snapshots
  statement {
    sid       = "AllowGrantsForServices"
    actions   = ["kms:CreateGrant"]
    resources = ["*"]
    principals {
      type = "Service"
      identifiers = [
        "rds.amazonaws.com",
        "elasticache.amazonaws.com",
        "ec2.amazonaws.com",
      ]
    }
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
}

resource "aws_kms_key" "data" {
  description             = "${var.name_prefix} data-tier encryption (RDS, Redis, EBS, S3 app data)"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  rotation_period_in_days = 365
  policy                  = data.aws_iam_policy_document.data_key_policy.json
  tags                    = merge(var.tags, { Name = "${var.name_prefix}-data" })
}

resource "aws_kms_alias" "data" {
  name          = "alias/${var.name_prefix}-data"
  target_key_id = aws_kms_key.data.key_id
}

# ─── secrets key ─────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "secrets_key_policy" {
  statement {
    sid       = "RootAccount"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.account_id}:root"]
    }
  }
  statement {
    sid = "SecretsManagerUsage"
    actions = [
      "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
      "kms:GenerateDataKey*", "kms:DescribeKey",
    ]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["secretsmanager.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.account_id]
    }
  }
}

resource "aws_kms_key" "secrets" {
  description             = "${var.name_prefix} Secrets Manager encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  rotation_period_in_days = 365
  policy                  = data.aws_iam_policy_document.secrets_key_policy.json
  tags                    = merge(var.tags, { Name = "${var.name_prefix}-secrets" })
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.name_prefix}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# ─── audit key ───────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "audit_key_policy" {
  statement {
    sid       = "RootAccount"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.account_id}:root"]
    }
  }
  statement {
    sid = "CloudTrailUsage"
    actions = [
      "kms:GenerateDataKey*", "kms:Decrypt", "kms:DescribeKey",
    ]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.account_id]
    }
  }
  statement {
    sid = "S3AuditUsage"
    actions = [
      "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
      "kms:GenerateDataKey*", "kms:DescribeKey",
    ]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.account_id]
    }
  }
}

resource "aws_kms_key" "audit" {
  description             = "${var.name_prefix} long-term audit archive encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  rotation_period_in_days = 365
  policy                  = data.aws_iam_policy_document.audit_key_policy.json
  tags                    = merge(var.tags, { Name = "${var.name_prefix}-audit" })
}

resource "aws_kms_alias" "audit" {
  name          = "alias/${var.name_prefix}-audit"
  target_key_id = aws_kms_key.audit.key_id
}

data "aws_region" "current" {}
