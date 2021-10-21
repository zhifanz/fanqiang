output "user" {
  value = aws_iam_user.default.name
}
output "aws_access_key_id" {
  value = aws_iam_access_key.default.id
}
output "aws_secret_access_key" {
  value = aws_iam_access_key.default.secret
}
