/**
 * VPC + 6 subnets across 2 AZs:
 *   public-1a  10.0.1.0/24    public-1b  10.0.2.0/24
 *   priv-app-1a 10.0.11.0/24  priv-app-1b 10.0.12.0/24
 *   priv-data-1a 10.0.21.0/24 priv-data-1b 10.0.22.0/24
 */

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  is_production = var.cost_mode == "production"
  azs           = slice(data.aws_availability_zones.available.names, 0, 2)
  az_a          = local.azs[0]
  az_b          = local.azs[1]
  nat_count     = local.is_production ? 2 : 1
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(var.tags, { Name = "${var.name_prefix}-vpc" })
}

# ─── public subnets ─────────────────────────────────────────────────────────
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = local.az_a
  map_public_ip_on_launch = false
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-1a"
    Tier = "public"
  })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = local.az_b
  map_public_ip_on_launch = false
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-1b"
    Tier = "public"
  })
}

# ─── private app subnets ────────────────────────────────────────────────────
resource "aws_subnet" "private_app_a" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = local.az_a
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-app-1a"
    Tier = "private-app"
  })
}

resource "aws_subnet" "private_app_b" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = local.az_b
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-app-1b"
    Tier = "private-app"
  })
}

# ─── private data subnets ───────────────────────────────────────────────────
resource "aws_subnet" "private_data_a" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = local.az_a
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-data-1a"
    Tier = "private-data"
  })
}

resource "aws_subnet" "private_data_b" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = local.az_b
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-data-1b"
    Tier = "private-data"
  })
}

# ─── IGW + NAT ──────────────────────────────────────────────────────────────
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = merge(var.tags, { Name = "${var.name_prefix}-igw" })
}

resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"
  tags   = merge(var.tags, { Name = "${var.name_prefix}-nat-eip-${count.index}" })

  depends_on = [aws_internet_gateway.this]
}

resource "aws_nat_gateway" "this" {
  count         = local.nat_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = count.index == 0 ? aws_subnet.public_a.id : aws_subnet.public_b.id
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-${count.index == 0 ? "1a" : "1b"}"
  })
  depends_on = [aws_internet_gateway.this]
}

# ─── route tables ───────────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
  tags = merge(var.tags, { Name = "${var.name_prefix}-public-rt" })
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Per-AZ private-app route tables (each routes to its own NAT, falling
# back to the only NAT when in learning mode)
resource "aws_route_table" "private_app_a" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[0].id
  }
  tags = merge(var.tags, { Name = "${var.name_prefix}-private-app-1a-rt" })
}

resource "aws_route_table" "private_app_b" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = local.nat_count == 2 ? aws_nat_gateway.this[1].id : aws_nat_gateway.this[0].id
  }
  tags = merge(var.tags, { Name = "${var.name_prefix}-private-app-1b-rt" })
}

resource "aws_route_table_association" "private_app_a" {
  subnet_id      = aws_subnet.private_app_a.id
  route_table_id = aws_route_table.private_app_a.id
}

resource "aws_route_table_association" "private_app_b" {
  subnet_id      = aws_subnet.private_app_b.id
  route_table_id = aws_route_table.private_app_b.id
}

# Data tier has NO internet route. Outbound calls happen via VPC endpoints
# only — that's the intent.
resource "aws_route_table" "private_data" {
  vpc_id = aws_vpc.this.id
  tags   = merge(var.tags, { Name = "${var.name_prefix}-private-data-rt" })
}

resource "aws_route_table_association" "private_data_a" {
  subnet_id      = aws_subnet.private_data_a.id
  route_table_id = aws_route_table.private_data.id
}

resource "aws_route_table_association" "private_data_b" {
  subnet_id      = aws_subnet.private_data_b.id
  route_table_id = aws_route_table.private_data.id
}
