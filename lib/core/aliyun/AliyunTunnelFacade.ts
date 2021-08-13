import { readCloudInitResource } from "../cloudInit";
import { defaultCredentials } from "./credentials";
import { AliyunOperations } from "./AliyunOperations";
import axios from "axios";
import { DEFAULT_INSTANCE_CONFIG } from "./InstanceConfig";

const RESOURCE_GROUP_NAME = "fanqiang";

export class AliyunTunnelFacade {
  async deploy(regionId: string, proxyIp: string, proxyPort: number): Promise<string> {
    const credentials = defaultCredentials();
    const aliyun = new AliyunOperations(axios.create(), credentials);
    console.log("Checking resource group...");
    const resourceGroupId = await aliyun.ensureResourceGroup(RESOURCE_GROUP_NAME);
    console.log("Creating VPC...");
    const vpcId = await aliyun.createVpc(regionId, resourceGroupId);
    const securityGroupId = await aliyun.createSecurityGroup(regionId, resourceGroupId, vpcId, proxyPort);
    const instanceConfig = DEFAULT_INSTANCE_CONFIG;
    const zoneId = await aliyun.determineZoneId(
      regionId,
      instanceConfig.instanceChargeType,
      instanceConfig.instanceType
    );
    const vSwitchId = await aliyun.createVSwitch(regionId, vpcId, zoneId);
    console.log("Creating ecs instance...");
    return aliyun.createEcsInstance(
      regionId,
      resourceGroupId,
      securityGroupId,
      vSwitchId,
      await cloudInitScript(proxyIp, proxyPort),
      instanceConfig
    );
  }

  async destroy(regionId: string): Promise<void> {
    const aliyun = new AliyunOperations(axios.create(), defaultCredentials());
    const resourceGroupId = await aliyun.findResourceGroup(RESOURCE_GROUP_NAME);
    if (!resourceGroupId) {
      console.log("Resource group does not exists: " + RESOURCE_GROUP_NAME);
      return;
    }
    await aliyun.deleteEcsInstances(regionId, resourceGroupId);
    await aliyun.deleteSecurityGroups(regionId, resourceGroupId);
    await aliyun.deleteVpcs(regionId, resourceGroupId);
    console.log("Successfully delete all resources under resource group: " + RESOURCE_GROUP_NAME);
  }
}

async function cloudInitScript(proxyIp: string, proxyPort: number): Promise<string> {
  const plainContent = await readCloudInitResource("tunnel-config.sh");
  return plainContent.replace("$PORT", proxyPort.toString()).replace("$PROXY_ADDRESS", proxyIp + ":" + proxyPort);
}
