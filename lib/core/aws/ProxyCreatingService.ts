import { Bundle, IpAddressType, LightsailClient, NetworkProtocol } from "@aws-sdk/client-lightsail";
import { readCloudInitResource } from "../cloudInit";
import { TunnelProxyEndpoints } from "../../domain/TunnelProxyEndpoints";
import { waitCondition } from "../langUtils";
import { ProxyServiceSupport } from "./ProxyServiceSupport";
import { randomBytes } from "crypto";
import { invokeDestroyCapable } from "./awsUtils";

export class ProxyCreatingService extends ProxyServiceSupport {
  async create(instanceName: string, port: number): Promise<TunnelProxyEndpoints> {
    const config = { encryptionAlgorithm: "aes-256-gcm", port, password: randomBytes(20).toString("base64") };
    await this.operations.CreateInstances({
      availabilityZone: await this.determineZone(),
      blueprintId: "amazon_linux_2",
      bundleId: await this.determineBundle(),
      ipAddressType: IpAddressType.IPV4,
      instanceNames: [instanceName],
      userData: await shadowsocksSetupScript(config.port, config.password, config.encryptionAlgorithm),
    });
    await waitCondition(async () => (await this.operations.GetInstanceState({ instanceName })).name === "running");
    await this.operations.OpenInstancePublicPorts({
      instanceName,
      portInfo: { fromPort: config.port, toPort: config.port, protocol: NetworkProtocol.TCP },
    });

    const instance = await this.operations.GetInstance({ instanceName });

    return {
      address: <string>instance.publicIpAddress,
      ...config,
    };
  }

  private async determineBundle(): Promise<string> {
    const bundles = (<Required<Bundle>[]>await this.operations.GetBundles(false)).sort((a, b) => a.price - b.price);
    if (!bundles.length) {
      throw new Error("No available bundle!");
    }
    return bundles[0].bundleId;
  }

  private async determineZone(): Promise<string> {
    const zones = (await this.operations.GetRegion({ includeAvailabilityZones: true })).availabilityZones?.map(
      (z) => <string>z.zoneName
    );
    if (zones && zones.length) {
      return zones[0];
    }
    throw new Error("No available zone!");
  }
}

async function shadowsocksSetupScript(port: number, password: string, encryptionAlgorithm: string): Promise<string> {
  const content = await readCloudInitResource("proxy-config.sh");
  return content
    .replace("$ADDRESS", "[::]:" + port)
    .replace("$ENCRYPTION_ALGORITHM", encryptionAlgorithm)
    .replace("$PASSWORD", password);
}

export function createProxy(region: string, port: number, instanceName: string): Promise<TunnelProxyEndpoints> {
  return invokeDestroyCapable(new LightsailClient({ region }), (client) =>
    new ProxyCreatingService(client).create(instanceName, port)
  );
}
