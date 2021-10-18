terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
    alicloud = {
      source  = "aliyun/alicloud"
      version = "1.134.0"
    }
  }
}

provider "aws" {
  region = var.proxy_region
}
provider "alicloud" {
  region = var.tunnel_region
}

module "proxy" {
  source               = "./modules/proxy"
  encryption_algorithm = var.encryption_algorithm
  instance_name        = "fanqiang"
  password             = var.password
  port                 = var.port
  public_key           = var.public_key
}

module "tunnel" {
  source          = "./modules/tunnel"
  proxy_port      = var.port
  proxy_public_ip = module.proxy.public_ip
  public_key      = var.public_key
}

resource "aws_s3_bucket" "default" {
  bucket        = var.bucket
  acl           = "public-read"
  force_destroy = true
}
