/**
 * 8 CloudWatch alarms — the deck's PRD targets, plus dependency-tier health.
 * All alarms post to the critical SNS topic; the topic optionally has an
 * email subscription (set var.alerts_email).
 */

resource "aws_sns_topic" "critical" {
  name              = "${var.name_prefix}-alerts-critical"
  kms_master_key_id = var.data_kms_arn
  tags              = var.tags
}

resource "aws_sns_topic_subscription" "critical_email" {
  count     = var.alerts_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.critical.arn
  protocol  = "email"
  endpoint  = var.alerts_email
}

# 1. ALB target P95 latency > 400 ms for 5 min — login UX safety net
resource "aws_cloudwatch_metric_alarm" "api_p95" {
  alarm_name          = "${var.name_prefix}-alarm-api-p95"
  alarm_description   = "ALB target P95 latency > 0.4s for 5 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  threshold           = 0.4
  alarm_actions       = [aws_sns_topic.critical.arn]
  ok_actions          = [aws_sns_topic.critical.arn]

  metric_query {
    id          = "p95"
    return_data = true
    metric {
      metric_name = "TargetResponseTime"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "p95"
      dimensions = {
        LoadBalancer = var.alb_arn_suffix
      }
    }
  }

  tags = var.tags
}

# 2. ALB 5xx > 0 (any) — deploys / regressions / runaway exceptions
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.name_prefix}-alarm-5xx-rate"
  alarm_description   = "Any ALB 5xx response in the last minute"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "HTTPCode_Target_5XX_Count"
  namespace   = "AWS/ApplicationELB"
  period      = 60
  statistic   = "Sum"
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
  treat_missing_data = "notBreaching"

  tags = var.tags
}

# 3. RDS CPU > 80% for 10 min
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.name_prefix}-alarm-rds-cpu"
  alarm_description   = "RDS CPU > 80% for 10 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 10
  threshold           = 80
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "CPUUtilization"
  namespace   = "AWS/RDS"
  period      = 60
  statistic   = "Average"
  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

# 4. RDS connection count > 150 (well below max_connections=200)
resource "aws_cloudwatch_metric_alarm" "rds_conns" {
  alarm_name          = "${var.name_prefix}-alarm-rds-conns"
  alarm_description   = "RDS active connections > 150 for 5 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  threshold           = 150
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "DatabaseConnections"
  namespace   = "AWS/RDS"
  period      = 60
  statistic   = "Average"
  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

# 5. ElastiCache memory > 80%
resource "aws_cloudwatch_metric_alarm" "redis_mem" {
  alarm_name          = "${var.name_prefix}-alarm-redis-mem"
  alarm_description   = "Redis memory usage > 80% for 5 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  threshold           = 80
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "DatabaseMemoryUsagePercentage"
  namespace   = "AWS/ElastiCache"
  period      = 60
  statistic   = "Average"
  dimensions = {
    ReplicationGroupId = var.redis_replication_group_id
  }

  tags = var.tags
}

# 6. Redis evictions — TTL/maxmemory not draining cleanly
resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${var.name_prefix}-alarm-redis-evictions"
  alarm_description   = "Redis evictions > 0 for 5 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  threshold           = 0
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "Evictions"
  namespace   = "AWS/ElastiCache"
  period      = 60
  statistic   = "Sum"
  dimensions = {
    ReplicationGroupId = var.redis_replication_group_id
  }
  treat_missing_data = "notBreaching"

  tags = var.tags
}

# 7. ALB unhealthy hosts
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy" {
  alarm_name          = "${var.name_prefix}-alarm-alb-unhealthy"
  alarm_description   = "ALB unhealthy hosts > 0 for 5 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  threshold           = 0
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "UnHealthyHostCount"
  namespace   = "AWS/ApplicationELB"
  period      = 60
  statistic   = "Maximum"
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }

  tags = var.tags
}

# 8. ASG: too few healthy instances (covers AZ outages)
resource "aws_cloudwatch_metric_alarm" "asg_capacity" {
  alarm_name          = "${var.name_prefix}-alarm-asg-low-capacity"
  alarm_description   = "ASG GroupInServiceInstances < 1 for 5 min"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  threshold           = 1
  alarm_actions       = [aws_sns_topic.critical.arn]

  metric_name = "GroupInServiceInstances"
  namespace   = "AWS/AutoScaling"
  period      = 60
  statistic   = "Average"
  dimensions = {
    AutoScalingGroupName = var.asg_name
  }

  tags = var.tags
}
