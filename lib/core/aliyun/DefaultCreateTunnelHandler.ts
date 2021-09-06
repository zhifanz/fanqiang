import AutoProvisioningTunnelCreatingService from "./AutoProvisioningTunnelCreatingService";
import PlainEcsTunnelCreatingService from "./PlainEcsTunnelCreatingService";
import { TunnelCreatingService } from "./TunnelCreatingService";
import { AliyunOperations } from "./AliyunOperations";

export class DefaultCreateTunnelHandler {
  constructor(private readonly operations: AliyunOperations) {}

  execute(
    region: string,
    resourceGroup: string,
    proxyAddress: string,
    proxyPort: number,
    autoProvisioning: boolean
  ): Promise<string> {
    console.log(`Creating tunnel infrastructures for region [${region}]...`);

    const serviceConstructor = autoProvisioning ? AutoProvisioningTunnelCreatingService : PlainEcsTunnelCreatingService;
    return (<TunnelCreatingService>new serviceConstructor(this.operations)).create(
      region,
      resourceGroup,
      proxyAddress,
      proxyPort
    );
  }
}
