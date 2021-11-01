output "public_ip" {
  value = data.aws_network_interface.default.association[0].public_ip
}
