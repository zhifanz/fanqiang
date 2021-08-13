import { AwsLightsailProxyDeployer } from "./aws/AwsLightsailProxyDeployer";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailTemplate } from "./aws/AwsLightsailTemplate";
import { DEFAULT_INSTANCE_NAME } from "./aws/AwsLightsailProxyConfig";
import { generateConfigFrom } from "./clash";
import * as fs from "fs-extra";
import { AliyunTunnelFacade } from "./aliyun/AliyunTunnelFacade";

export class TunnelProxyFacade {
  async createTunnelProxy(proxyRegion: string, clashConfigPath: string, tunnelRegion?: string): Promise<void> {
    await fs.ensureFile(clashConfigPath);
    console.log(`Creating proxy infrastructures for region [${proxyRegion}]...`);
    const endpoints = await new AwsLightsailProxyDeployer().apply(proxyRegion);
    if (tunnelRegion) {
      console.log(`Creating tunnel infrastructures for region [${tunnelRegion}]...`);
      endpoints.ipv4 = await new AliyunTunnelFacade().deploy(tunnelRegion, endpoints.ipv4, endpoints.port);
    }
    await fs.writeFile(clashConfigPath, generateConfigFrom(endpoints));
    console.log("saved client config to " + clashConfigPath);
  }

  async destroyTunnelProxy(proxyRegion: string, tunnelRegion?: string): Promise<void> {
    console.log("Destroying tunnel proxy infrastructures...");
    if (tunnelRegion) {
      await new AliyunTunnelFacade().destroy(tunnelRegion);
    }
    const client = new LightsailClient({ region: proxyRegion });
    try {
      await new AwsLightsailTemplate(client).deleteInstance(DEFAULT_INSTANCE_NAME);
    } finally {
      client.destroy();
    }
    console.log("Successfully destroy tunnel proxy!");
  }
}
