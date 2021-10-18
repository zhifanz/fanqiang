output "tunnel_public_ip" {
  value = module.tunnel.public_ip
}
output "bucket_domain_name" {
  value = aws_s3_bucket.default.bucket_domain_name
}
output "proxy_public_ip" {
  value = module.proxy.public_ip
}
