terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}

resource "aws_sqs_queue" "default" {
  name = var.queue_name
  visibility_timeout_seconds = 60
  receive_wait_time_seconds = 20
}

resource "aws_iam_user" "default" {
  name = "fanqiang-analysis"
  force_destroy = true
}

resource "aws_iam_user_policy_attachment" "default" {
  for_each = toset(["AmazonSQSFullAccess", "AmazonS3FullAccess"])
  user = aws_iam_user.default.name
  policy_arn = "arn:aws:iam::aws:policy/${each.key}"
}

resource "aws_iam_access_key" "default" {
  user = aws_iam_user.default.name
}
