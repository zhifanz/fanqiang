resource "alicloud_vpc" "default" {
  cidr_block = "192.168.0.0/16"
}

resource "alicloud_vswitch" "default" {
  count = length(data.alicloud_zones.default.ids)
  zone_id = data.alicloud_zones.default.ids[count.index]
  cidr_block = "192.168.${count.index}.0/24"
  vpc_id = alicloud_vpc.default.id
}

resource "alicloud_security_group" "default" {
  vpc_id = alicloud_vpc.default.id
}

resource "alicloud_security_group_rule" "default" {
  security_group_id = alicloud_security_group.default.id
  ip_protocol = "tcp"
  type = "ingress"
  cidr_ip = "0.0.0.0/0"
  port_range = "${var.port}/${var.port}"
}

resource "alicloud_auto_provisioning_group" "default" {
  launch_template_id = alicloud_ecs_launch_template.default.id
  total_target_capacity = "1"
  pay_as_you_go_target_capacity = "0"
  spot_target_capacity = "1"
  auto_provisioning_group_type = "maintain"
  spot_allocation_strategy = "lowest-price"
  spot_instance_interruption_behavior = "terminate"
  excess_capacity_termination_policy = "termination"
  terminate_instances = true
  dynamic "launch_template_config" {
    for_each = alicloud_vswitch.default.*.id
    content {
      instance_type = local.instance_type
      max_price = local.max_price_per_hour
      vswitch_id = launch_template_config.value
      weighted_capacity = "1"
    }
  }
}

resource "alicloud_ecs_launch_template" "default" {
  launch_template_name = "fanqiang"
  image_id = local.image_id
  instance_charge_type = "PostPaid"
  instance_type = local.instance_type
  security_group_id = alicloud_security_group.default.id
  spot_duration = 0
  spot_strategy = "SpotAsPriceGo"
  ram_role_name = alicloud_ram_role.default.id
  user_data = base64encode(templatefile("${path.root}/cloud-init/tunnel-init.sh", {
    proxy_port = var.port,
    proxy_address = aws_lightsail_instance.default.public_ip_address,
    elastic_ip_allocation_id = alicloud_eip_address.default.id,
    region = var.tunnel_region
    ram_role_name = alicloud_ram_role.default.id
  }))
  system_disk {
    category = "cloud_efficiency"
    delete_with_instance = true
    size = 40
  }
}


resource "alicloud_ram_role" "default" {
  name = "FangqiangEcsEipAccessRole"
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
  force = true
}

resource "alicloud_ram_role_policy_attachment" "default" {
  policy_name = "AliyunEIPFullAccess"
  policy_type = "System"
  role_name = alicloud_ram_role.default.id
}

resource "alicloud_eip_address" "default" {
  bandwidth = local.internet_max_bandwidth_out
  internet_charge_type = "PayByTraffic"
}

data "alicloud_zones" "default" {}


