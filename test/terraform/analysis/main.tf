terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}

provider "aws" {
  region = var.region
}
module "analysis" {
  source = "../../../terraform/modules/analysis"
  queue_name = var.queue_name
}
resource "aws_s3_bucket" "default" {
  bucket        = var.bucket
  acl           = "public-read"
  force_destroy = true
}
variable "bucket" {
  type = string
}
variable "region" {
  type = string
}
variable "queue_name" {
  type = string
}
output "aws_access_key_id" {
  value = module.analysis.aws_access_key_id
}
output "aws_secret_access_key" {
  value = module.analysis.aws_secret_access_key
  sensitive = true
}
