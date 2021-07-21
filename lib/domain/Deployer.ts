import { TunnelProxyEndpoints } from "./TunnelProxyEndpoints";

export interface Deployer {
  apply(region: string, password: string): Promise<TunnelProxyEndpoints>;
}
