import { DestroyHandler } from "../domain/DestroyHandler";
import { ResourceIndex } from "../domain/ResourceIndexRepository";
import { TunnelDestroyingService } from "./aliyun/TunnelDestroyingService";
import { ProxyDestroyingService } from "./aws/ProxyDestroyingService";
import { AliyunOperations } from "./aliyun/AliyunOperations";

export class DefaultDestroyHandler implements DestroyHandler {
  constructor(private readonly aliyunOperations: AliyunOperations) {}

  async execute(resourceIndex: ResourceIndex): Promise<void> {
    if (resourceIndex.tunnel) {
      console.log("Destroying tunnel infrastructures...");
      await new TunnelDestroyingService(this.aliyunOperations).destroy(
        resourceIndex.tunnel.region,
        resourceIndex.tunnel.resourceGroup
      );
    }
    console.log("Destroying proxy infrastructures...");
    await new ProxyDestroyingService().destroy(resourceIndex.proxy.region, resourceIndex.proxy.instanceName);
    console.log("Successfully destroy tunnel proxy!");
  }
}
