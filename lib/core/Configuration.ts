import { CredentialsProviders, getCredentialsProviders } from "./Credentials";
import * as path from "path";
import * as os from "os";
import { ProxyOptions, TunnelProxyOperations } from "../domain/TunnelProxyOperations";
import { TerraformTunnelProxyOperations } from "./TerraformTunnelProxyOperations";

export const ProxyDefaults: Pick<ProxyOptions, "port" | "encryptionAlgorithm"> = {
  port: 8388,
  encryptionAlgorithm: "aes-256-gcm",
} as const;

export const DefaultRegions = {
  proxy: "us-east-1",
  tunnel: "cn-shanghai",
} as const;

export interface Configuration {
  credentialsProviders: CredentialsProviders;
  terraformWorkspace: string;
  tunnelProxyOperations?: TunnelProxyOperations;
}

export async function loadConfiguration(): Promise<Configuration> {
  const configuration: Configuration = {
    credentialsProviders: await getCredentialsProviders(),
    terraformWorkspace: path.join(os.homedir(), ".fanqiang", "runtime"),
  };
  configuration.tunnelProxyOperations = new TerraformTunnelProxyOperations(configuration);
  return configuration;
}
