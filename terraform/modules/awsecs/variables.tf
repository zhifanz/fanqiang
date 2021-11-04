variable "port" {
  type = number
}
variable "encryption_algorithm" {
  type = string
}
variable "password" {
  type = string
}
variable "service_name" {
  type = string
  default = "shadowsocks"
}
variable "log_subscription" {
  type = object({
    name = string
    destination = string
    filter_pattern = string
  })
  default = null
}
