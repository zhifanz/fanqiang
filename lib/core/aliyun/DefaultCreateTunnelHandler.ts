import { CreateTunnelHandler } from "../../domain/CreateTunnelHandler";
import { AddressInfo } from "../../domain/TunnelProxyEndpoints";
import AutoProvisioningTunnelCreatingService from "./AutoProvisioningTunnelCreatingService";
import PlainEcsTunnelCreatingService from "./PlainEcsTunnelCreatingService";
import { TunnelCreatingService } from "./TunnelCreatingService";
import { AliyunOperations } from "./AliyunOperations";

export class DefaultCreateTunnelHandler implements CreateTunnelHandler {
  constructor(private readonly operations: AliyunOperations) {}

  execute(
    region: string,
    resourceGroup: string,
    proxyAddress: AddressInfo,
    autoProvisioning: boolean
  ): Promise<AddressInfo> {
    console.log(`Creating tunnel infrastructures for region [${region}]...`);

    const serviceConstructor = autoProvisioning ? AutoProvisioningTunnelCreatingService : PlainEcsTunnelCreatingService;
    return (<TunnelCreatingService>new serviceConstructor(this.operations)).create(region, resourceGroup, proxyAddress);
  }
}
