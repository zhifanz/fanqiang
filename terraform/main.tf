terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 3.0"
    }
    alicloud = {
      source = "aliyun/alicloud"
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

locals {
  instance_type = "ecs.t5-lc2m1.nano"
  image_id = "aliyun_2_1903_x64_20G_alibase_20210726.vhd"
  internet_max_bandwidth_out = 100
  max_price_per_hour = "0.05"
}
