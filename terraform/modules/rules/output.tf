output "fc_endpoint" {
  value = "https://${data.alicloud_account.default.id}.${data.alicloud_regions.default.ids[0]}.fc.aliyuncs.com/2016-08-15/proxy/${alicloud_fc_service.default.id}.LATEST/${var.aliyun_fc_name}/"
}
