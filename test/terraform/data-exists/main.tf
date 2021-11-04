terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

data "aws_iam_roles" "default" {
  name_regex = "^ecsTaskExecutionRole$"
}

output "exists" {
  value = length(data.aws_iam_roles.default.names)
}
