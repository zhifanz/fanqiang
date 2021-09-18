import yaml from "yaml";
import { ProxyOptions } from "./TunnelProxyOperations";

export type TunnelProxyConnectionInfo = ProxyOptions & {
  address: string;
};

export function generateConfigFrom(endpoints: TunnelProxyConnectionInfo): string {
  return yaml.stringify({
    port: 7890,
    "socks-port": 7891,
    "redir-port": 7892,
    "tproxy-port": 7893,
    "mixed-port": 7890,
    mode: "rule",
    dns: {
      enable: true,
      listen: "0.0.0.0:53",
      "enhanced-mode": "redir-host",
    },
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
    rules: ["DOMAIN-SUFFIX,google.com,auto", "DOMAIN,ad.com,REJECT", "GEOIP,CN,DIRECT", "MATCH,auto"],
  });
}
