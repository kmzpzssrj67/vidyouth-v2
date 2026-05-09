/**
 * VPC Flow Logs to a CloudWatch log group. The IAM role is provided by the
 * foundations module so we don't need cross-module circular deps.
 */

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/${var.name_prefix}/vpc-flow-logs"
  retention_in_days = 30
  tags              = var.tags
}

resource "aws_flow_log" "vpc" {
  iam_role_arn    = var.flow_logs_role_arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.this.id
  tags            = merge(var.tags, { Name = "${var.name_prefix}-vpc-flow-log" })
}
