import { AliyunCredentials, loadCredentials } from "./aliyunCredentials";
import * as path from "path";
import * as os from "os";
import { TunnelProxyOperations } from "../domain/TunnelProxyOperations";
import { TerraformTunnelProxyOperations } from "./TerraformTunnelProxyOperations";

export interface Configuration {
  aliyun: {
    credentials: AliyunCredentials;
  };
  terraformWorkspace: string;
  tunnelProxyOperations?: TunnelProxyOperations;
}

export async function loadConfiguration(): Promise<Configuration> {
  const configuration: Configuration = {
    aliyun: {
      credentials: await loadCredentials(),
    },
    terraformWorkspace: path.join(os.homedir(), ".fanqiang", "runtime"),
  };
  configuration.tunnelProxyOperations = new TerraformTunnelProxyOperations(configuration);
  return configuration;
}
