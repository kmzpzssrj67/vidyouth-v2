/**
 * RDS Postgres 16. Sizing flips on var.cost_mode:
 *   production -> db.m6i.large + Multi-AZ + 200 GB gp3 + 30-day backups
 *   learning   -> db.t3.medium + single-AZ + 50 GB gp3 + 7-day backups
 *
 * Master password is read from Secrets Manager (created by the secrets
 * module). The app reads it the same way at boot via its EC2 IAM role.
 */

locals {
  is_production = var.cost_mode == "production"

  rds_instance_class      = local.is_production ? "db.m6i.large" : "db.t3.medium"
  rds_storage_gb          = local.is_production ? 200 : 50
  rds_multi_az            = local.is_production
  rds_backup_retention    = local.is_production ? 30 : 7
  rds_deletion_protection = local.is_production
  rds_iops                = local.is_production ? 3000 : null
  rds_throughput          = local.is_production ? 125 : null
}

# Master password sourced from Secrets Manager (manage_master_user_password=false
# so we keep our own rotation hook later)
data "aws_secretsmanager_secret_version" "db_master" {
  secret_id = var.db_password_secret_arn
}

resource "aws_db_subnet_group" "this" {
  name        = "${var.name_prefix}-db-subnets"
  description = "RDS subnet group across the private data subnets"
  subnet_ids  = var.data_subnet_ids
  tags        = merge(var.tags, { Name = "${var.name_prefix}-db-subnets" })
}

resource "aws_db_parameter_group" "postgres16" {
  name        = "${var.name_prefix}-pg16"
  family      = "postgres16"
  description = "${var.name_prefix} Postgres 16 parameters"

  parameter {
    name  = "log_min_duration_statement"
    value = "500"
  }
  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  parameter {
    name  = "log_connections"
    value = "1"
  }
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  parameter {
    name  = "log_lock_waits"
    value = "1"
  }
  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }
  parameter {
    name  = "idle_in_transaction_session_timeout"
    value = "60000"
  }

  tags = var.tags
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name_prefix}-pg"
  engine         = "postgres"
  engine_version = "16.4"
  instance_class = local.rds_instance_class

  allocated_storage     = local.rds_storage_gb
  max_allocated_storage = local.rds_storage_gb * 2 # autoscale headroom
  storage_type          = "gp3"
  iops                  = local.rds_iops
  storage_throughput    = local.rds_throughput
  storage_encrypted     = true
  kms_key_id            = var.data_kms_arn

  db_name  = "vidyouth_lms"
  username = "vidyouthadmin"
  password = data.aws_secretsmanager_secret_version.db_master.secret_string

  multi_az              = local.rds_multi_az
  publicly_accessible   = false
  vpc_security_group_ids = [var.rds_security_group_id]
  db_subnet_group_name  = aws_db_subnet_group.this.name
  parameter_group_name  = aws_db_parameter_group.postgres16.name

  backup_retention_period = local.rds_backup_retention
  backup_window           = "21:30-22:00"
  maintenance_window      = "sun:22:30-sun:23:30"
  copy_tags_to_snapshot   = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  performance_insights_kms_key_id       = var.data_kms_arn

  monitoring_interval = 60
  monitoring_role_arn = var.monitoring_role_arn

  deletion_protection      = local.rds_deletion_protection
  skip_final_snapshot      = !local.is_production
  final_snapshot_identifier = local.is_production ? "${var.name_prefix}-pg-final-${formatdate("YYYYMMDD-hhmmss", timestamp())}" : null

  auto_minor_version_upgrade = true
  apply_immediately          = !local.is_production

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(var.tags, { Name = "${var.name_prefix}-pg" })

  lifecycle {
    ignore_changes = [
      # Don't fight the timestamp() refresh on every plan
      final_snapshot_identifier,
      # Allow out-of-band password rotation via Secrets Manager
      password,
    ]
  }
}
