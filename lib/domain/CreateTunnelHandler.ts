import { AddressInfo } from "./TunnelProxyEndpoints";

export interface CreateTunnelHandler {
  execute(
    region: string,
    resourceGroup: string,
    proxyAddress: AddressInfo,
    autoProvisioning: boolean
  ): Promise<AddressInfo>;
}
