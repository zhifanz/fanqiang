variable "port" {
  type = number
}
variable "encryption_algorithm" {
  type = string
}
variable "password" {
  type = string
}
variable "name" {
  type = string
  default = "shadowsocks"
}
