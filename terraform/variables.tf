variable "region" {
  default = "us-east-1"
}

variable "vpc_id" {
  description = "VPC ID to deploy Redis into"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the ElastiCache subnet group"
  type        = list(string)
}
