/**
 * ElastiCache Redis 7.1.
 *
 *   production -> 2 node cluster (1 primary + 1 replica), Multi-AZ, automatic_failover
 *   learning   -> 1 node, no replica, no Multi-AZ
 *
 * Always: at-rest + in-transit encryption, AUTH token from Secrets Manager.
 */

data "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = var.redis_auth_secret_arn
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-redis-subnets"
  subnet_ids = var.data_subnet_ids
  tags       = var.tags
}

resource "aws_elasticache_parameter_group" "redis7" {
  name        = "${var.name_prefix}-redis7"
  family      = "redis7"
  description = "${var.name_prefix} Redis 7 parameter group"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  parameter {
    name  = "timeout"
    value = "300"
  }
  parameter {
    name  = "tcp-keepalive"
    value = "60"
  }

  tags = var.tags
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${var.name_prefix}-redis"
  description          = "${var.name_prefix} Redis: OTPs, lockout counters, session sets"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.t3.small"
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis7.name

  num_cache_clusters         = local.is_production ? 2 : 1
  automatic_failover_enabled = local.is_production
  multi_az_enabled           = local.is_production

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [var.redis_security_group_id]

  at_rest_encryption_enabled = true
  kms_key_id                 = var.data_kms_arn
  transit_encryption_enabled = true
  auth_token                 = data.aws_secretsmanager_secret_version.redis_auth.secret_string
  auth_token_update_strategy = "ROTATE"

  snapshot_retention_limit = local.is_production ? 7 : 1
  snapshot_window          = "23:00-00:00"
  maintenance_window       = "sun:00:30-sun:01:30"

  apply_immediately          = !local.is_production
  auto_minor_version_upgrade = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-redis" })

  lifecycle {
    ignore_changes = [auth_token]
  }
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/${var.name_prefix}/redis/slow"
  retention_in_days = local.is_production ? 30 : 7
  kms_key_id        = var.data_kms_arn
  tags              = var.tags
}
