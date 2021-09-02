import { DestroyHandler } from "../domain/DestroyHandler";
import { ResourceIndex } from "../domain/ResourceIndexRepository";
import { TunnelDestroyingService } from "./aliyun/TunnelDestroyingService";
import { AwsProxyDestroyingService } from "./aws/AwsProxyDestroyingService";
import { AliyunOperations } from "./aliyun/AliyunOperations";
import { LightsailOperations } from "./aws/LightsailOperations";
import { AwsS3CloudStorage } from "./aws/AwsS3CloudStorage";
import { AliyunOssCloudStorage } from "./aliyun/AliyunOssCloudStorage";

export class DefaultDestroyHandler implements DestroyHandler {
  constructor(
    private readonly aliyunOperations: AliyunOperations,
    private readonly aliyunCloudStorage: AliyunOssCloudStorage,
    private readonly awsOperations: LightsailOperations,
    private readonly s3CloudStorage: AwsS3CloudStorage
  ) {}

  async execute(resourceIndex: ResourceIndex): Promise<void> {
    if (resourceIndex.tunnel) {
      console.log("Destroying tunnel infrastructures...");
      await new TunnelDestroyingService(this.aliyunOperations, this.aliyunCloudStorage).destroy(
        resourceIndex.tunnel.region,
        resourceIndex.tunnel.resourceGroup
      );
    }
    console.log("Destroying proxy infrastructures...");
    await new AwsProxyDestroyingService(this.awsOperations, this.s3CloudStorage).destroy(
      resourceIndex.proxy.region,
      resourceIndex.proxy.instanceName
    );
    console.log("Successfully destroy tunnel proxy!");
  }
}
