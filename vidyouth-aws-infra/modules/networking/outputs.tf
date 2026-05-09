output "vpc_id" {
  value = aws_vpc.this.id
}

output "vpc_cidr" {
  value = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  value = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_app_subnet_ids" {
  value = [aws_subnet.private_app_a.id, aws_subnet.private_app_b.id]
}

output "private_data_subnet_ids" {
  value = [aws_subnet.private_data_a.id, aws_subnet.private_data_b.id]
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  value = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  value = aws_security_group.rds.id
}

output "redis_security_group_id" {
  value = aws_security_group.redis.id
}

output "vpc_endpoint_security_group_id" {
  value = aws_security_group.vpc_endpoints.id
}

output "nat_gateway_count" {
  value = local.nat_count
}

output "availability_zones" {
  value = local.azs
}
