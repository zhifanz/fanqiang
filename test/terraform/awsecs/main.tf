terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}
variable "region" {
  type = string
}
variable "port" {
  type = number
}
provider "aws" {
  region = var.region
}
provider "time" {}
module "awsecs" {
  source = "../../../terraform/modules/awsecs"
  encryption_algorithm = "plain"
  password = "hello-kitty"
  port = var.port
  name = "fanqiang-test"
}
output "public_ip" {
  value = module.awsecs.public_ip
}
