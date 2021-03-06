variable "proxy_region" {
  type = string
}
variable "tunnel_region" {
  type = string
}
variable "port" {
  type = number
}
variable "password" {
  type = string
}
variable "encryption_algorithm" {
  type = string
}
variable "bucket" {
  type = string
}
variable "public_key" {
  type    = string
  default = null
}
variable "analysis" {
  type = object({
    queue_name = string
    bundle_path = string
    s3_rules_key = string
  })
}
