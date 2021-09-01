import { AddressInfo } from "../../domain/TunnelProxyEndpoints";

export interface TunnelCreatingService {
  create(regionId: string, resourceGroupName: string, proxyAddress: AddressInfo): Promise<AddressInfo>;
}
