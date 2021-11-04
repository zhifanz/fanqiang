variable "region" {
  type = string
}
variable "port" {
  type = number
}
provider "aws" {
  region = var.region
}
module "awsecs" {
  source = "../../../terraform/modules/awsecs"
  encryption_algorithm = "plain"
  password = "hello-kitty"
  port = var.port
  service_name = "fanqiang-test"
}
output "subnet_id" {
  value = module.awsecs.subnet_id
}
