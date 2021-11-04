terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "1.134.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}

resource "alicloud_fc_service" "default" {
  name_prefix = var.aliyun_fc_name
  internet_access = true
}
resource "alicloud_fc_function" "default" {
  service = alicloud_fc_service.default.id
  name = var.aliyun_fc_name
  filename = var.aliyun_fc.lib_path
  handler = var.aliyun_fc.handler
  memory_size = 128
  runtime = "python3"
  timeout = 30
}
resource "alicloud_fc_trigger" "default" {
  service = alicloud_fc_service.default.id
  function = var.aliyun_fc_name
  name = "http"
  type = "http"
  config = jsonencode({
    methods = ["GET"]
    authType = var.aliyun_fc.require_authentication == true ? "function" : "anonymous"
  })
  depends_on = [alicloud_fc_function.default]
}
data "alicloud_account" "default" {}
data "alicloud_regions" "default" {
  current = true
}

resource "aws_lambda_function" "default" {
  function_name = "${var.aws_lambda_name_prefix}-log-processor"
  role = aws_iam_role.default.arn
  filename = var.aws_lambda.filename
  handler = var.aws_lambda.handler
  package_type = "Zip"
  runtime = "python3.6"
}
resource "aws_iam_role" "default" {
  name_prefix = "dynamodbFullAccessRole"
  managed_policy_arns = ["arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess", "arn:aws:iam::aws:policy/CloudWatchLogsReadOnlyAccess"]
  force_detach_policies = true
  assume_role_policy = data.aws_iam_policy_document.default.json
}
data "aws_iam_policy_document" "default" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}
resource "aws_lambda_permission" "default" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.default.function_name
  principal     = "logs.eu-west-1.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.default.arn}:*"
}
