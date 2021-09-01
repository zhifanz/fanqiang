import { TunnelProxyEndpoints } from "./TunnelProxyEndpoints";
import { CloudSaveFunc } from "./CloudStorage";
import * as fs from "fs-extra";
import yaml from "yaml";
import path from "path";
import * as os from "os";

export class ClashConfigWriter {
  async writeLocal(endpoints: TunnelProxyEndpoints): Promise<string> {
    const filePath = localConfigPath();
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, generateConfigFrom(endpoints));
    return filePath;
  }

  async writeLink(endpoints: TunnelProxyEndpoints, cloudSave: CloudSaveFunc): Promise<string> {
    return cloudSave("clash/config.yaml", generateConfigFrom(endpoints));
  }
}

function localConfigPath(): string {
  return path.join(os.homedir(), ".config", "clash", "fanqiang.yaml");
}

function generateConfigFrom(endpoints: TunnelProxyEndpoints): string {
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
