variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "allowed_cidr" {
  description = "The CIDR block allowed to access the application"
  type        = string
  default     = "10.0.0.0/8"
}
