import { LightsailClient, NetworkProtocol } from "@aws-sdk/client-lightsail";
import { defaultConfig } from "./AwsLightsailProxyConfig";
import { readCloudInitResource } from "./cloudInit";
import { Deployer } from "../domain/Deployer";
import { TunnelProxyEndpoints } from "../domain/TunnelProxyEndpoints";
import { AwsLightsailTemplate } from "./AwsLightsailTemplate";

export class AwsLightsailProxyDeployer implements Deployer {
  async apply(region: string): Promise<TunnelProxyEndpoints> {
    const client = new LightsailClient({ region });
    const template = new AwsLightsailTemplate(client);
    try {
      const {
        port,
        instanceName,
        encryptionAlgorithm,
        password,
        ...instanceConfig
      } = await defaultConfig(template);
      await template.createInstance({
        ...instanceConfig,
        instanceNames: [instanceName],
        userData: await AwsLightsailProxyDeployer.shadowsocksSetupScript(
          port,
          password,
          encryptionAlgorithm
        ),
      });
      await this.waitForRunning(template, instanceName);
      await template.openInstancePublicPorts(
        instanceName,
        NetworkProtocol.TCP,
        port
      );
      await template.openInstancePublicPorts(
        instanceName,
        NetworkProtocol.UDP,
        port
      );

      const instance = await template.getInstance(instanceName);
      return {
        ipv4: instance.publicIpAddress as string,
        ipv6: (instance.ipv6Addresses as string[])[0],
        port,
        encryptionAlgorithm,
        password,
      };
    } finally {
      client.destroy();
    }
  }

  private static async shadowsocksSetupScript(
    port: number,
    password: string,
    encryptionAlgorithm: string
  ): Promise<string> {
    const content = await readCloudInitResource("proxy-config.sh");
    return content
      .replace("$ADDRESS", "[::]:" + port)
      .replace("$ENCRYPTION_ALGORITHM", encryptionAlgorithm)
      .replace("$PASSWORD", password);
  }

  private async waitForRunning(
    template: AwsLightsailTemplate,
    instanceName: string
  ): Promise<void> {
    let retries = 0;
    while (retries < 10) {
      const state = await template.getInstanceState(instanceName);
      if (state.name === "running") {
        break;
      }
      console.log("Instance is not ready yet, waiting for 5 seconds...");
      await this.sleep(5000);
      retries += 1;
    }
    if (retries === 10) {
      throw new Error("Failed to launch a lightsail instance: " + instanceName);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
