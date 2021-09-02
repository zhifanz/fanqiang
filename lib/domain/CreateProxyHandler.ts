import { TunnelProxyEndpoints } from "./TunnelProxyEndpoints";

export interface CreateProxyHandler {
  create(region: string, instanceName: string, port: number): Promise<TunnelProxyEndpoints>;
}
