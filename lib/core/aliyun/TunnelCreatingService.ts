export interface TunnelCreatingService {
  create(regionId: string, resourceGroupName: string, proxyAddress: string, proxyPort: number): Promise<string>;
}
