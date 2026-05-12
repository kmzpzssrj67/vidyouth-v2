output "rds_instance_id" {
  value = aws_db_instance.this.id
}

output "rds_endpoint" {
  description = "DB instance endpoint (host:port)."
  value       = aws_db_instance.this.endpoint
  sensitive   = true
}

output "rds_address" {
  value     = aws_db_instance.this.address
  sensitive = true
}

output "rds_port" {
  value = aws_db_instance.this.port
}

output "rds_db_name" {
  value = aws_db_instance.this.db_name
}

output "redis_replication_group_id" {
  value = aws_elasticache_replication_group.this.id
}

output "redis_primary_endpoint" {
  description = "Primary endpoint for the replication group."
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
  sensitive   = true
}

output "redis_reader_endpoint" {
  description = "Reader endpoint (production only; equals primary in learning mode)."
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
  sensitive   = true
}

output "redis_port" {
  value = aws_elasticache_replication_group.this.port
}
