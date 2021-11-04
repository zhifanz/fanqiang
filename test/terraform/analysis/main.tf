terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "1.134.0"
    }
  }
}

module "analysis" {
  source = "../../../terraform/modules/analysis"
  aliyun_fc_name = "pingtest"
  aliyun_fc = {
    lib_path = var.lib_path
    handler = "index.handler"
    require_authentication = false
  }
}

provider "alicloud" {
  region = var.region
}
variable "region" {
  type = string
}
variable "lib_path" {
  type = string
}
output "fc_endpoint" {
  value = module.analysis.fc_endpoint
}
