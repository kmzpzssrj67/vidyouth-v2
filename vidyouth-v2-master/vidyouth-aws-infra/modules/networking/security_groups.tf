/**
 * 4 application security groups + 1 SG for the VPC interface endpoints.
 * Inter-SG references (not raw CIDRs) so the security model lives at L7
 * (which group can talk to which) rather than at L3 (which IP).
 */

# ─── ALB ─────────────────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-sg-alb"
  description = "Public-facing ALB. 80/443 from internet."
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description = "HTTP redirected to HTTPS by listener"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description = "All egress (forwarded to EC2 only by listener rules)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-sg-alb" })
}

# ─── EC2 application tier ───────────────────────────────────────────────────
resource "aws_security_group" "ec2" {
  name        = "${var.name_prefix}-sg-ec2"
  description = "Application EC2 instances. Only ALB can reach 8080."
  vpc_id      = aws_vpc.this.id

  egress {
    description = "All egress for image pulls + dependency calls (via NAT)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-sg-ec2" })
}

resource "aws_security_group_rule" "ec2_from_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ec2.id
  source_security_group_id = aws_security_group.alb.id
  description              = "App port from ALB only"
}

# ─── RDS Postgres ───────────────────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-sg-rds"
  description = "RDS Postgres. Only the application tier can reach 5432."
  vpc_id      = aws_vpc.this.id

  egress {
    description = "All egress (RDS rarely needs it; kept open for AWS service plumbing)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-sg-rds" })
}

resource "aws_security_group_rule" "rds_from_ec2" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.ec2.id
  description              = "Postgres from app tier only"
}

# ─── Redis ──────────────────────────────────────────────────────────────────
resource "aws_security_group" "redis" {
  name        = "${var.name_prefix}-sg-redis"
  description = "ElastiCache Redis. Only app tier."
  vpc_id      = aws_vpc.this.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-sg-redis" })
}

resource "aws_security_group_rule" "redis_from_ec2" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = aws_security_group.redis.id
  source_security_group_id = aws_security_group.ec2.id
  description              = "Redis from app tier only"
}

# ─── VPC interface endpoints ────────────────────────────────────────────────
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.name_prefix}-sg-vpc-endpoints"
  description = "Interface endpoints for AWS services. 443 from VPC."
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "443 from anywhere inside the VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.this.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-sg-vpc-endpoints" })
}
