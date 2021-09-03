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

export type TunnelProxyEndpoint = string;

export type CreateTunnelProxyFunction = (request: TunnelProxyCreatingRequest) => Promise<TunnelProxyEndpoint>;

export type DestroyTunnelProxyFunction = () => Promise<void>;
