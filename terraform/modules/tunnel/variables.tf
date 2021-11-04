variable "proxy_public_ip" {
  type = string
}
variable "proxy_port" {
  type = number
}
variable "public_key" {
  type    = string
  default = null
}
variable "analysis" {
  type = object({
    queue_name = string
    queue_region = string
    bundle_url = string
    aws_access_key_id = string
    aws_secret_access_key = string
    s3_bucket = string
    s3_rules_key = string
  })
  default = {
    queue_name = ""
    queue_region = ""
    bundle_url = ""
    aws_access_key_id = ""
    aws_secret_access_key = ""
    s3_bucket = ""
    s3_rules_key = ""
  }
}
variable "ram_role_name" {
  type = string
  default = "FangqiangEcsEipAccessRole"
}
variable "launch_template_name" {
  type = string
  default = "fanqiang"
}
