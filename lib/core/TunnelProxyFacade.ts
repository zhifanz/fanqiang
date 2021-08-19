import { AwsLightsailProxyDeployer } from "./aws/AwsLightsailProxyDeployer";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailTemplate } from "./aws/AwsLightsailTemplate";
import { DEFAULT_INSTANCE_NAME } from "./aws/AwsLightsailProxyConfig";
import { generateConfigFrom } from "./clash";
import * as fs from "fs-extra";
import { TunnelDestroyingService } from "./aliyun/TunnelDestroyingService";
import { AliyunOperations } from "./aliyun/AliyunOperations";
import axios from "axios";
import { defaultCredentials } from "./aliyun/credentials";
import { TunnelCreatingService } from "./aliyun/TunnelCreatingService";

export class TunnelProxyFacade {
  async createTunnelProxy(
    proxyRegion: string,
    clashConfigPath: string,
    tunnelConfig?: { region: string; arch: string }
  ): Promise<void> {
    await fs.ensureFile(clashConfigPath);
    console.log(`Creating proxy infrastructures for region [${proxyRegion}]...`);
    const endpoints = await new AwsLightsailProxyDeployer().apply(proxyRegion);
    if (tunnelConfig) {
      console.log(`Creating tunnel infrastructures for region [${tunnelConfig.region}]...`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceConstructor = require(`./aliyun/${tunnelConfig.arch}TunnelCreatingService`).default;
      endpoints.ipv4 = (
        await (<TunnelCreatingService>new serviceConstructor(defaultAliyunOperations())).create(tunnelConfig.region, {
          address: endpoints.ipv4,
          family: "ipv4",
          port: endpoints.port,
        })
      ).address;
    }
    console.log("Successfully created tunnel proxy!");
    await fs.writeFile(clashConfigPath, generateConfigFrom(endpoints));
    console.log("saved client config to " + clashConfigPath);
  }

  async destroyTunnelProxy(proxyRegion: string, tunnelRegion?: string): Promise<void> {
    if (tunnelRegion) {
      console.log("Destroying tunnel infrastructures...");
      await new TunnelDestroyingService(defaultAliyunOperations()).destroy(tunnelRegion);
    }
    console.log("Destroying proxy infrastructures...");
    const client = new LightsailClient({ region: proxyRegion });
    try {
      await new AwsLightsailTemplate(client).deleteInstance(DEFAULT_INSTANCE_NAME);
    } catch (e) {
      if (e.code?.includes("DoesNotExist")) {
        console.log(e.message);
      } else {
        throw e;
      }
    } finally {
      client.destroy();
    }
    console.log("Successfully destroy tunnel proxy!");
  }
}

function defaultAliyunOperations() {
  return new AliyunOperations(axios.create(), defaultCredentials());
}
