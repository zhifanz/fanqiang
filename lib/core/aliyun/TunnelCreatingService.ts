import { TunnelProxyEndpoint } from "../../domain/tunnelProxyActionTypes";

export interface TunnelCreatingService {
  create(
    regionId: string,
    resourceGroupName: string,
    proxyAddress: string,
    proxyPort: number
  ): Promise<TunnelProxyEndpoint>;
}
