import { ResourceGroup, Vpc, Zone } from "./AliyunOperations";
import { AbstractTunnelCreatingService, InstanceConfig, subCidrBlock } from "./AbstractTunnelCreatingService";
import { singletonResult, waitCondition } from "../langUtils";
import { waitOperation } from "./aliyunUtils";

const InstanceType = "ecs.t5-lc2m1.nano";

export default class PlainEcsTunnelCreatingService extends AbstractTunnelCreatingService {
  protected async doCreate(
    regionId: string,
    resourceGroup: ResourceGroup,
    vpc: Vpc,
    instanceConfig: InstanceConfig
  ): Promise<string> {
    console.log("Creating ECS instance...");
    const instance = await this.operations.createInstance(InstanceType, regionId, {
      ...instanceConfig,
      VSwitchId: (
        await this.createVSwitchAvailable(
          subCidrBlock(vpc.CidrBlock, 0),
          vpc.VpcId,
          (
            await this.determineZone(regionId, instanceConfig.InstanceChargeType, InstanceType)
          ).ZoneId,
          regionId
        )
      ).VSwitchId,
      ResourceGroupId: resourceGroup.Id,
    });
    console.log("Assigning public ip...");
    const address = await waitOperation(
      () => this.operations.allocatePublicIpAddress(instance.InstanceId),
      "IncorrectInstanceStatus"
    );
    await this.operations.startInstance(instance.InstanceId);
    await waitCondition(
      async () =>
        singletonResult(await this.operations.describeInstanceStatus(regionId, [instance.InstanceId])).Status ===
        "Running"
    );
    return address;
  }

  private async determineZone(RegionId: string, InstanceChargeType: string, InstanceType: string): Promise<Zone> {
    const zones = (
      await this.operations.describeZones(RegionId, {
        InstanceChargeType,
        SpotStrategy: "NoSpot",
      })
    ).filter((z) => z.AvailableInstanceTypes.InstanceTypes.includes(InstanceType));
    if (!zones.length) {
      throw new Error("No zone available for instance type: " + InstanceType);
    }
    return zones[0];
  }
}
