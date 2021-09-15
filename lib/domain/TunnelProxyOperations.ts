import { Bucket } from "./CloudStorage";

export interface TunnelProxyOperations {
  create(request: TunnelProxyCreatingRequest): Promise<TunnelProxyCreatingResult>;

  destroy(): Promise<void>;
}

export type TunnelProxyCreatingRequest = ProxyOptions & {
  proxyRegion: string;
  tunnelRegion: string;
};
export type ProxyOptions = {
  port: number;
  encryptionAlgorithm: string;
  password: string;
};

export type TunnelProxyCreatingResult = { address: string; bucket: Bucket };
