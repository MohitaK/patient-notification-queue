output "redis_endpoint" {
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  description = "Redis host — set as REDIS_HOST env var in producer and worker"
}
