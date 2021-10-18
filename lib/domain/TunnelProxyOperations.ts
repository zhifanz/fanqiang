import { CloudStorage } from "./CloudStorage";

export interface TunnelProxyOperations {
  create(request: TunnelProxyCreatingRequest): Promise<TunnelProxyCreatingResult>;

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

export type TunnelProxyCreatingResult = { address: string; cloudStorage: CloudStorage };
