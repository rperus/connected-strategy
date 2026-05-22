provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "cs-enterprise-vpc"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "cs-private-subnet"
  }
}

resource "aws_security_group" "app_sg" {
  vpc_id = aws_vpc.main.id
  name   = "cs-app-sg"

  ingress {
    from_port   = 4311
    to_port     = 4311
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr] # Restrict access to internal corporate network
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # Can be restricted if NAT Gateway is configured
  }
}
