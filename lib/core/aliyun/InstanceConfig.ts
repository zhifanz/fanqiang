export type InstanceConfig = {
  instanceType: string;
  imageId: string;
  internetChargeType: string;
  internetMaxBandwidthOut: string;
  instanceChargeType: string;
  systemDiskSize: string;
  systemDiskCategory: string;
};

export const DEFAULT_INSTANCE_CONFIG: InstanceConfig = {
  instanceType: "ecs.t5-lc2m1.nano",
  imageId: "aliyun_3_x64_20G_alibase_20210425.vhd",
  internetChargeType: "PayByTraffic",
  internetMaxBandwidthOut: "100",
  instanceChargeType: "PostPaid",
  systemDiskSize: "20",
  systemDiskCategory: "cloud_efficiency",
};
