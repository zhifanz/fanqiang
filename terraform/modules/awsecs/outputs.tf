output "subnet_id" {
  value = aws_subnet.default.id
}
output "log_group" {
  value = {
    name = aws_cloudwatch_log_group.default.name
    arn = aws_cloudwatch_log_group.default.arn
    region = data.aws_region.default.name
  }
}
