import { CloudSaveFunction } from "./cloudSave";

export type TunnelProxyCreatingRequest = Pick<
  TunnelProxyConnectionInfo,
  "port" | "encryptionAlgorithm" | "password"
> & {
  enableCloudStorage: boolean;
  proxyRegion: string;
  tunnel?: { region: string; autoProvisioning: boolean };
};

export type TunnelProxyConnectionInfo = {
  port: number;
  address: string;
  encryptionAlgorithm: string;
  password: string;
};

export type TunnelProxyCreatingResponse = { endpoint: string; cloudSave?: CloudSaveFunction };

export type CreateTunnelProxyFunction = (request: TunnelProxyCreatingRequest) => Promise<TunnelProxyCreatingResponse>;

export type DestroyTunnelProxyFunction = () => Promise<void>;
