import { LightsailClient, NetworkProtocol } from "@aws-sdk/client-lightsail";
import { defaultConfig } from "./AwsLightsailProxyConfig";
import { readCloudInitResource } from "../cloudInit";
import { Deployer } from "../../domain/Deployer";
import { TunnelProxyEndpoints } from "../../domain/TunnelProxyEndpoints";
import { AwsLightsailTemplate } from "./AwsLightsailTemplate";
import { waitCondition } from "../langUtils";

export class AwsLightsailProxyDeployer implements Deployer {
  async apply(region: string): Promise<TunnelProxyEndpoints> {
    const client = new LightsailClient({ region });
    const template = new AwsLightsailTemplate(client);
    try {
      const { port, instanceName, encryptionAlgorithm, password, ...instanceConfig } = await defaultConfig(template);
      await template.createInstance({
        ...instanceConfig,
        instanceNames: [instanceName],
        userData: await AwsLightsailProxyDeployer.shadowsocksSetupScript(port, password, encryptionAlgorithm),
      });
      await waitCondition(async () => (await template.getInstanceState(instanceName)).name === "running");
      await template.openInstancePublicPorts(instanceName, NetworkProtocol.TCP, port);
      await template.openInstancePublicPorts(instanceName, NetworkProtocol.UDP, port);

      const instance = await template.getInstance(instanceName);
      return {
        ipv4: instance.publicIpAddress as string,
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
}