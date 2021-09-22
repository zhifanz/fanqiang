resource "aws_lightsail_instance" "default" {
  availability_zone = data.aws_availability_zones.default.names[0]
  blueprint_id      = "centos_8"
  bundle_id         = "nano_2_0"
  name              = "fanqiang"
  user_data = templatefile("${path.root}/cloud-init/proxy-init.sh", {
    port                 = var.port,
    encryption_algorithm = var.encryption_algorithm,
    password             = var.password
  })
}

resource "aws_lightsail_instance_public_ports" "default" {
  instance_name = aws_lightsail_instance.default.name

  dynamic "port_info" {
    for_each = [var.port, 22]
    content {
      protocol  = "tcp"
      from_port = port_info.value
      to_port   = port_info.value
    }
  }
}

resource "aws_s3_bucket" "default" {
  bucket = var.bucket
  acl = "public-read"
  force_destroy = true
}

data "aws_availability_zones" "default" {
  state = "available"
}
