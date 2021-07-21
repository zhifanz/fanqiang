import { TunnelProxyEndpoints } from "../domain/TunnelProxyEndpoints";
import { randomBytes } from "crypto";
import { AwsLightsailProxyDeployer } from "./AwsLightsailProxyDeployer";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailTemplate } from "./AwsLightsailTemplate";
import { DEFAULT_INSTANCE_NAME } from "./AwsLightsailProxyConfig";

export class TunnelProxyFacade {
  async createTunnelProxy(
    region: string
  ): Promise<TunnelProxyEndpoints & { password: string }> {
    const password = randomPassword();
    const endpoints = await new AwsLightsailProxyDeployer().apply(
      region,
      password
    );
    return { ...endpoints, password };
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

function randomPassword(): string {
  return randomBytes(16).toString("base64");
}
