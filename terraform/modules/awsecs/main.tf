terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
    time = {
      source = "hashicorp/time"
      version = "0.7.2"
    }
  }
}

locals {
  cidr_block = "192.168.0.0"
}

resource "aws_vpc" "default" {
  cidr_block = "${local.cidr_block}/16"
}
resource "aws_internet_gateway" "default" {
  vpc_id = aws_vpc.default.id
}
resource "aws_route" "gateway" {
  route_table_id = aws_vpc.default.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id = aws_internet_gateway.default.id
}
resource "aws_subnet" "default" {
  cidr_block = "${local.cidr_block}/24"
  vpc_id = aws_vpc.default.id
  map_public_ip_on_launch = true
}
resource "aws_security_group_rule" "default" {
  from_port = var.port
  to_port = var.port
  protocol = "tcp"
  security_group_id = aws_vpc.default.default_security_group_id
  type = "ingress"
  cidr_blocks = ["0.0.0.0/0"]
}


resource "aws_ecs_cluster" "default" {
  name = var.name
}

resource "aws_ecs_service" "default" {
  name = var.name
  cluster = aws_ecs_cluster.default.arn
  desired_count = 1
  launch_type = "FARGATE"
  task_definition = aws_ecs_task_definition.default.arn
  network_configuration {
    subnets = [aws_subnet.default.id]
    assign_public_ip = true
  }
}

resource "aws_ecs_task_definition" "default" {
  container_definitions = jsonencode([
    {
      name = "ssserver"
      image = "zhifanz/ssserver-rust:1.0.0"
      command = ["-s", "[::]:${var.port}", "-m", var.encryption_algorithm, "-k", var.password, "--log-without-time", "-v"]
      portMappings = [{
        containerPort = var.port
      }]
      logConfiguration = {
        logDriver = "awsfirelens"
        options = {
          Name = "stdout"
        }
      }
    },
    {
      name = "log_router"
      image = "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable"
      firelensConfiguration = {
        type = "fluentbit"
      }
    }
  ])
  family = var.name
  cpu = "256"
  memory = "512"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
}

resource "time_sleep" "wait" {
  depends_on = [aws_ecs_service.default]
  create_duration = "15s"
}

data "aws_network_interface" "default" {
  filter {
    name = "subnet-id"
    values = [aws_subnet.default.id]
  }
  depends_on = [time_sleep.wait]
}
