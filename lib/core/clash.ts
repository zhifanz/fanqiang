import { TunnelProxyEndpoints } from "../domain/TunnelProxyEndpoints";
import yaml from "yaml";
import * as os from "os";
import path from "path";

export const DEFAULT_CONFIG_PATH = path.join(
  os.homedir(),
  ".config",
  "clash",
  "fanqiang.yaml"
);

export function generateConfigFrom(endpoints: TunnelProxyEndpoints): string {
  return yaml.stringify({
    port: 7890,
    "socks-port": 7891,
    mode: "global",
    proxies: [
      {
        name: "shadowsocks",
        type: "ss",
        server: endpoints.ipv4,
        port: endpoints.port,
        cipher: endpoints.encryptionAlgorithm,
        password: endpoints.password,
      },
    ],
  });
}
