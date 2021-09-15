import { AliyunCredentials, loadCredentials } from "./aliyunCredentials";
import * as path from "path";
import { homedir } from "os";
import { CloudStorage } from "../domain/CloudStorage";
import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import { LocalFileStoredOptionsRepository, StoredOptionsRepository } from "./StoredOptions";
import { TunnelProxyOperations } from "../domain/TunnelProxyOperations";
import { TerraformTunnelProxyOperations } from "./TerraformTunnelProxyOperations";

export const APP_NAME = "fanqiang";

export interface Configuration {
  aliyun: {
    credentials: AliyunCredentials;
  };
  cloudStorage: CloudStorage;
  storedOptionsRepository: StoredOptionsRepository;
  tunnelProxyOperations?: TunnelProxyOperations;
}

export async function loadConfiguration(): Promise<Configuration> {
  const configuration: Configuration = {
    aliyun: {
      credentials: await loadCredentials(),
    },
    cloudStorage: new AwsS3CloudStorage(),
    storedOptionsRepository: new LocalFileStoredOptionsRepository(
      path.join(homedir(), ".config", APP_NAME, "options.json")
    ),
  };
  configuration.tunnelProxyOperations = new TerraformTunnelProxyOperations(configuration);
  return configuration;
}
