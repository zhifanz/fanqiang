import yaml from "yaml";
import { ProxyOptions } from "./TunnelProxyOperations";

export type TunnelProxyConnectionInfo = ProxyOptions & {
  address: string;
};

export function generateConfigFrom(endpoints: TunnelProxyConnectionInfo, ruleUrl: string): string {
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
      nameserver: ["223.5.5.5", "119.29.29.29", "114.114.114.114", "tls://dns.rubyfish.cn:853"],
    },
    proxies: [
      {
        name: "auto",
        type: "ss",
        server: endpoints.address,
        port: endpoints.port,
        cipher: endpoints.encryptionAlgorithm,
        password: endpoints.password,
      },
    ],
    "rule-providers": {
      domestic: {
        type: "http",
        behavior: "domain",
        path: "./direct_domains.yaml",
        url: ruleUrl
      }
    },
    rules: ["RULE-SET,domestic,DIRECT", "DOMAIN-SUFFIX,google.com,auto", "DOMAIN,ad.com,REJECT", "GEOIP,CN,DIRECT", "MATCH,auto"],
  });
}
