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
  analysis = {
    queue_name = var.analysis.queue_name
    bundle_url = "http://${aws_s3_bucket.default.bucket_domain_name}/${aws_s3_bucket_object.analysis_bundle.id}"
    aws_access_key_id = module.analysis.aws_access_key_id
    aws_secret_access_key = module.analysis.aws_secret_access_key
  }
}

module "tunnel" {
  source          = "./modules/tunnel"
  proxy_port      = var.port
  proxy_public_ip = module.proxy.public_ip
  public_key      = var.public_key
  analysis = {
    queue_name = var.analysis.queue_name
    queue_region = var.proxy_region
    bundle_url = "http://${aws_s3_bucket.default.bucket_domain_name}/${aws_s3_bucket_object.analysis_bundle.id}"
    aws_access_key_id = module.analysis.aws_access_key_id
    aws_secret_access_key = module.analysis.aws_secret_access_key
    s3_bucket = aws_s3_bucket.default.id
    s3_rules_key = var.analysis.s3_rules_key
  }
}

module "analysis" {
  source = "./modules/analysis"
  queue_name = var.analysis.queue_name
}

resource "aws_s3_bucket" "default" {
  bucket        = var.bucket
  acl           = "public-read"
  force_destroy = true
}

resource "aws_s3_bucket_object" "analysis_bundle" {
  bucket = aws_s3_bucket.default.id
  key = "bundles/${basename(var.analysis.bundle_path)}"
  acl = "public-read"
  force_destroy = true
  source = var.analysis.bundle_path
}
