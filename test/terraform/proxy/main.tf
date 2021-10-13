terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}
module "proxy" {
  source = "../../../terraform/modules/proxy"
  instance_name = "fanqiang-test"
  password = "hello"
  port = var.port
  encryption_algorithm = var.encryption_algorithm
  public_key = var.public_key
}
provider "aws" {
  region = var.region
}
variable "region" {
  type = string
}
variable "port" {
  type = number
}
variable "encryption_algorithm" {
  type = string
}
variable "public_key" {
  type = string
}
output "public_ip" {
  value = module.proxy.public_ip
}
