import { Bundle, IpAddressType, NetworkProtocol } from "@aws-sdk/client-lightsail";
import { readCloudInitResource } from "../cloudInit";
import { waitCondition } from "../langUtils";
import { ProxyServiceSupport } from "./ProxyServiceSupport";
import { randomBytes } from "crypto";

export class AwsProxyCreatingService extends ProxyServiceSupport {
  async create(region: string, instanceName: string, port: number): Promise<string> {
    const config = { encryptionAlgorithm: "aes-256-gcm", port, password: randomBytes(20).toString("base64") };
    await this.operations.CreateInstances(region, {
      availabilityZone: await this.determineZone(region),
      blueprintId: "amazon_linux_2",
      bundleId: await this.determineBundle(region),
      ipAddressType: IpAddressType.IPV4,
      instanceNames: [instanceName],
      userData: await shadowsocksSetupScript(config.port, config.password, config.encryptionAlgorithm),
    });
    await waitCondition(
      async () => (await this.operations.GetInstanceState(region, { instanceName })).name === "running"
    );
    await this.operations.OpenInstancePublicPorts(region, {
      instanceName,
      portInfo: { fromPort: config.port, toPort: config.port, protocol: NetworkProtocol.TCP },
    });

    const instance = await this.operations.GetInstance(region, { instanceName });

    return <string>instance.publicIpAddress;
  }

  private async determineBundle(region: string): Promise<string> {
    const bundles = (<Required<Bundle>[]>await this.operations.GetBundles(region, false)).sort(
      (a, b) => a.price - b.price
    );
    if (!bundles.length) {
      throw new Error("No available bundle!");
    }
    return bundles[0].bundleId;
  }

  private async determineZone(region: string): Promise<string> {
    const zones = (await this.operations.GetRegion(region, { includeAvailabilityZones: true })).availabilityZones?.map(
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
