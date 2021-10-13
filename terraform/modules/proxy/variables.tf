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
