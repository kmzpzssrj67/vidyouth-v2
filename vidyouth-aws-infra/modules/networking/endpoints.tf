/**
 * VPC endpoints. Gateway endpoints for S3 + DynamoDB are free and route via
 * route-table prefix lists. Interface endpoints for the rest are billable
 * (~$7/endpoint/month, plus data) but keep traffic off NAT, which saves
 * money once volumes are real and meaningfully tightens the security
 * boundary (no internet round-trip for AWS calls).
 *
 * Cost trade-off note:
 *   In learning mode we provision a smaller set of interface endpoints to
 *   keep the bill modest. In production we attach all the ones the app
 *   actually uses.
 */

data "aws_region" "current" {}

# ─── Gateway endpoints (free) ────────────────────────────────────────────────
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private_app_a.id,
    aws_route_table.private_app_b.id,
    aws_route_table.private_data.id,
  ]
  tags = merge(var.tags, { Name = "${var.name_prefix}-vpce-s3" })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private_app_a.id,
    aws_route_table.private_app_b.id,
    aws_route_table.private_data.id,
  ]
  tags = merge(var.tags, { Name = "${var.name_prefix}-vpce-dynamodb" })
}

# ─── Interface endpoints ─────────────────────────────────────────────────────
locals {
  # Production: full set. Learning: only the most critical (cuts ~$50/mo).
  interface_endpoint_services = local.is_production ? [
    "secretsmanager",
    "kms",
    "ssm",
    "ssmmessages",
    "ec2messages",
    "logs",
    "monitoring",
    "ecr.api",
    "ecr.dkr",
  ] : [
    "secretsmanager",
    "ssm",
    "ssmmessages",
    "ec2messages",
    "logs",
  ]
}

resource "aws_vpc_endpoint" "interface" {
  for_each            = toset(local.interface_endpoint_services)
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.${each.value}"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids = [
    aws_subnet.private_app_a.id,
    aws_subnet.private_app_b.id,
  ]
  security_group_ids = [aws_security_group.vpc_endpoints.id]
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-${replace(each.value, ".", "-")}"
  })
}
