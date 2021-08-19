import { TunnelCreatingService } from "./TunnelCreatingService";
import { ResourceGroup, SecurityGroup, Vpc } from "./AliyunOperations";
import { AddressInfo } from "net";
import { readCloudInitResource } from "../cloudInit";
import { TunnelServiceSupport } from "./TunnelServiceSupport";
import { Netmask } from "netmask";
import { waitCondition } from "../langUtils";

const InstanceConstants = {
  ImageId: "aliyun_3_x64_20G_alibase_20210425.vhd",
  InternetChargeType: "PayByTraffic",
  InternetMaxBandwidthOut: "100",
  "SystemDisk.Size": "20",
  "SystemDisk.Category": "cloud_efficiency",
  InstanceChargeType: "PostPaid",
} as const;

export type InstanceConfig = typeof InstanceConstants & { readonly UserData: string; readonly SecurityGroupId: string };

export abstract class AbstractTunnelCreatingService extends TunnelServiceSupport implements TunnelCreatingService {
  async create(regionId: string, proxyAddress: AddressInfo): Promise<AddressInfo> {
    const resourceGroup = await this.defaultResourceGroup();
    console.log("Creating VPC...");
    const vpc = await this.operations.createVpc(regionId, {
      ResourceGroupId: resourceGroup.Id,
      CidrBlock: "192.168.0.0/16",
    });
    await waitCondition(
      async () => (await this.operations.describeVpcAttribute(regionId, vpc.VpcId)).Status === "Available"
    );
    const securityGroup = await this.createNetworkSecurityRules(regionId, resourceGroup.Id, vpc.VpcId, [
      22,
      proxyAddress.port,
    ]);
    const address = await this.doCreate(regionId, resourceGroup, vpc, {
      ...InstanceConstants,
      UserData: Buffer.from(await cloudInitScript(proxyAddress)).toString("base64"),
      SecurityGroupId: securityGroup.SecurityGroupId,
    });
    return { address, family: proxyAddress.family, port: proxyAddress.port };
  }

  private async createNetworkSecurityRules(
    RegionId: string,
    ResourceGroupId: string,
    VpcId: string,
    ports: number[]
  ): Promise<SecurityGroup> {
    const securityGroup = await this.operations.createSecurityGroup(RegionId, { ResourceGroupId, VpcId });
    for (const port of ports) {
      await this.operations.authorizeSecurityGroup("tcp", port + "/" + port, RegionId, securityGroup.SecurityGroupId, {
        SourceCidrIp: "0.0.0.0/0",
      });
    }
    return securityGroup;
  }

  protected abstract doCreate(
    regionId: string,
    resourceGroup: ResourceGroup,
    vpc: Vpc,
    instanceConfig: InstanceConfig
  ): Promise<string>;
}

async function cloudInitScript(proxyAddress: AddressInfo): Promise<string> {
  const plainContent = await readCloudInitResource("tunnel-config.sh");
  return plainContent
    .replace("$PORT", proxyAddress.port.toString())
    .replace("$PROXY_ADDRESS", proxyAddress.address + ":" + proxyAddress.port);
}

export function subCidrBlock(parentCidrBlock: string, index: number): string {
  const block = new Netmask(parentCidrBlock);
  return new Netmask(block.base + "/" + Math.max(block.bitmask + 1, 24)).next(index).toString();
}
