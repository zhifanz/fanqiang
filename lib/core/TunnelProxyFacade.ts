import { AwsLightsailProxyDeployer } from "./AwsLightsailProxyDeployer";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailTemplate } from "./AwsLightsailTemplate";
import { DEFAULT_INSTANCE_NAME } from "./AwsLightsailProxyConfig";
import { generateConfigFrom } from "./clash";
import * as fs from "fs-extra";

export class TunnelProxyFacade {
  async createTunnelProxy(
    region: string,
    clashConfigPath: string
  ): Promise<void> {
    await fs.ensureFile(clashConfigPath);
    const endpoints = await new AwsLightsailProxyDeployer().apply(region);
    await fs.writeFile(clashConfigPath, generateConfigFrom(endpoints));
  }

  async destroyTunnelProxy(region: string): Promise<void> {
    const client = new LightsailClient({ region });
    try {
      await new AwsLightsailTemplate(client).deleteInstance(
        DEFAULT_INSTANCE_NAME
      );
    } finally {
      client.destroy();
    }
  }
}
