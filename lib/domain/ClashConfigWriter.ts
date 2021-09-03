import { CloudSaveFunction } from "../core/CloudStorage";
import * as fs from "fs-extra";
import yaml from "yaml";
import path from "path";
import * as os from "os";
import { TunnelProxyConnectionInfo } from "./tunnelProxyActionTypes";

export class ClashConfigWriter {
  async writeLocal(endpoints: TunnelProxyConnectionInfo): Promise<string> {
    const filePath = localConfigPath();
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, generateConfigFrom(endpoints));
    return filePath;
  }

  async writeLink(endpoints: TunnelProxyConnectionInfo, cloudSave: CloudSaveFunction): Promise<string> {
    return cloudSave("clash/config.yaml", generateConfigFrom(endpoints));
  }
}

function localConfigPath(): string {
  return path.join(os.homedir(), ".config", "clash", "fanqiang.yaml");
}

function generateConfigFrom(endpoints: TunnelProxyConnectionInfo): string {
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
