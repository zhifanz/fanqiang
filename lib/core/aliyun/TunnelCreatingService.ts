import { AddressInfo } from "net";

export interface TunnelCreatingService {
  create(regionId: string, proxyAddress: AddressInfo): Promise<AddressInfo>;
}
