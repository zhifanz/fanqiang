terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "1.134.0"
    }
  }
}
module "tunnel" {
  source          = "../../../terraform/modules/tunnel"
  proxy_port      = var.proxy_port
  proxy_public_ip = var.proxy_public_ip
  public_key      = var.public_key
  ram_role_name = "TestFangqiangEcsEipAccessRole"
  launch_template_name = "TestFanqiang"
}
provider "alicloud" { region = var.region }
variable "proxy_port" { type = number }
variable "proxy_public_ip" { type = string }
variable "region" { type = string }
variable "public_key" { type = string }
output "public_ip" {
  value = module.tunnel.public_ip
}
