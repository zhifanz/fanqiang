import { AddressInfo } from "net";

export interface TunnelFacade {
  create(regionId: string, proxyAddress: AddressInfo): Promise<AddressInfo>;
  destroy(regionId: string): Promise<void>;
}
