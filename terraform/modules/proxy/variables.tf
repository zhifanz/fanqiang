variable "port" {
  type = number
}
variable "encryption_algorithm" {
  type = string
}
variable "password" {
  type = string
}
variable "instance_name" {
  type = string
}
variable "public_key" {
  type    = string
  default = null
}
variable "analysis" {
  type = object({
    queue_name = string
    bundle_url = string
    aws_access_key_id = string
    aws_secret_access_key = string
  })
  default = {
    queue_name = ""
    bundle_url = ""
    aws_access_key_id = ""
    aws_secret_access_key = ""
  }
}
