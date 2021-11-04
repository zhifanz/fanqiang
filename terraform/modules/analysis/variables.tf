variable "aliyun_fc_name" {
  type = string
  default = "ping"
}
variable "aliyun_fc" {
  type = object({
    lib_path = string
    handler = string
    require_authentication = bool
  })
}
variable "aws_lambda_name_prefix" {
  type = string
  default = "fanqiang"
}
variable "aws_lambda" {
  type = object({
    filename = string
    handler = string
  })
}
