terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "1.134.0"
    }
  }
}

resource "alicloud_vpc" "default" {
  cidr_block = "192.168.0.0/16"
}

resource "alicloud_vswitch" "default" {
  zone_id    = data.alicloud_zones.default.ids[0]
  cidr_block = "192.168.0.0/24"
  vpc_id     = alicloud_vpc.default.id
}

resource "alicloud_security_group" "default" {
  vpc_id = alicloud_vpc.default.id
}

resource "alicloud_security_group_rule" "default" {
  for_each          = toset(var.public_key != null ? [tostring(var.proxy_port), "22"] : [tostring(var.proxy_port)])
  security_group_id = alicloud_security_group.default.id
  ip_protocol       = "tcp"
  type              = "ingress"
  cidr_ip           = "0.0.0.0/0"
  port_range        = "${each.key}/${each.key}"
}
data "alicloud_zones" "default" {
  available_resource_creation = "Instance"
}


resource "alicloud_eci_container_group" "default" {
  container_group_name = var.name
  cpu = 0.25
  memory = 0.5
  vswitch_id = alicloud_vswitch.default.id
  zone_id = data.alicloud_zones.default.ids[0]
  containers {
    image = "zhifanz/nginx"
    name = "nginx"
    commands = []
    environment_vars {
      key = "PROXY_PORT"
      value = var.proxy_port
    }
    environment_vars {
      key = "PROXY_ADDRESS"
      value = var.proxy_public_ip
    }
    ports {
      protocol = "TCP"
      port = var.proxy_port
    }
  }
}
