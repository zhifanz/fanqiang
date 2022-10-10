export type ClashConfigUrl = string;
export interface TunnelProxyOperations {
  create(request: TunnelProxyCreatingRequest): Promise<ClashConfigUrl>;

  destroy(): Promise<void>;
}

export type TunnelProxyCreatingRequest = ProxyOptions & InfrastructureOptions;
export type InfrastructureOptions = {
  proxyRegion: string;
  tunnelRegion: string;
  bucket: string;
  publicKey?: string;
};
export type ProxyOptions = {
  port: number;
  encryptionAlgorithm: string;
  password: string;
};
