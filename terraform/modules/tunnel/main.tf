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
  count      = length(data.alicloud_zones.default.ids)
  zone_id    = data.alicloud_zones.default.ids[count.index]
  cidr_block = "192.168.${count.index}.0/24"
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

resource "alicloud_auto_provisioning_group" "default" {
  launch_template_id                  = alicloud_ecs_launch_template.default.id
  total_target_capacity               = "1"
  pay_as_you_go_target_capacity       = "0"
  spot_target_capacity                = "1"
  auto_provisioning_group_type        = "maintain"
  spot_allocation_strategy            = "lowest-price"
  spot_instance_interruption_behavior = "terminate"
  excess_capacity_termination_policy  = "termination"
  terminate_instances                 = true
  dynamic "launch_template_config" {
    for_each = alicloud_vswitch.default.*.id
    content {
      instance_type     = local.instance_type
      max_price         = local.max_price_per_hour
      vswitch_id        = launch_template_config.value
      weighted_capacity = "1"
    }
  }
}

resource "alicloud_ecs_launch_template" "default" {
  launch_template_name = "fanqiang"
  image_id             = local.image_id
  instance_charge_type = "PostPaid"
  instance_type        = local.instance_type
  security_group_id    = alicloud_security_group.default.id
  key_pair_name        = var.public_key != null ? alicloud_ecs_key_pair.default[0].id : null
  spot_duration        = 0
  spot_strategy        = "SpotAsPriceGo"
  ram_role_name        = alicloud_ram_role.default.id
  user_data = base64encode(templatefile("${path.module}/cloud-init.tpl", {
    proxy_port               = var.proxy_port
    proxy_address            = var.proxy_public_ip
    elastic_ip_allocation_id = alicloud_eip_address.default.id
    analysis_queue_name = var.analysis.queue_name
    analysis_queue_region = var.analysis.queue_region
    analysis_bundle_url = var.analysis.bundle_url
    analysis_aws_access_key_id = var.analysis.aws_access_key_id
    analysis_aws_secret_access_key = var.analysis.aws_secret_access_key
    s3_bucket = var.analysis.s3_bucket
    s3_rules_key = var.analysis.s3_rules_key
  }))
  system_disk {
    category             = "cloud_efficiency"
    delete_with_instance = true
    size                 = 40
  }
}

resource "alicloud_ecs_key_pair" "default" {
  count      = var.public_key != null ? 1 : 0
  public_key = var.public_key
}

resource "alicloud_ram_role" "default" {
  name     = "FangqiangEcsEipAccessRole"
  document = <<EOF
  {
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {
          "Service": [
            "ecs.aliyuncs.com"
          ]
        }
      }
    ],
    "Version": "1"
  }
  EOF
  force    = true
}

resource "alicloud_ram_role_policy_attachment" "default" {
  policy_name = "AliyunEIPFullAccess"
  policy_type = "System"
  role_name   = alicloud_ram_role.default.id
}

resource "alicloud_eip_address" "default" {
  bandwidth            = local.internet_max_bandwidth_out
  internet_charge_type = "PayByTraffic"
}

data "alicloud_zones" "default" {}

locals {
  instance_type              = "ecs.t5-lc2m1.nano"
  image_id                   = "aliyun_2_1903_x64_20G_alibase_20210726.vhd"
  internet_max_bandwidth_out = 100
  max_price_per_hour         = "0.05"
}
