export type AddressInfo = { address: string; port: number };

export interface TunnelProxyEndpoints extends AddressInfo {
  encryptionAlgorithm: string;
  password: string;
}
