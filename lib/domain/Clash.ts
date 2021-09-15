import yaml from "yaml";
import { ProxyOptions } from "./TunnelProxyOperations";

export type TunnelProxyConnectionInfo = ProxyOptions & {
  address: string;
};

export function generateConfigFrom(endpoints: TunnelProxyConnectionInfo): string {
  return yaml.stringify({
    port: 7890,
    "socks-port": 7891,
    mode: "global",
    proxies: [
      {
        name: "shadowsocks",
        type: "ss",
        server: endpoints.address,
        port: endpoints.port,
        cipher: endpoints.encryptionAlgorithm,
        password: endpoints.password,
      },
    ],
  });
}
