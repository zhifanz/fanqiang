output "address" {
  value = alicloud_eip_address.default.ip_address
}
output "bucket_domain_name" {
  value = aws_s3_bucket.default.bucket_domain_name
}
