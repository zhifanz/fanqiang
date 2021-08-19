import { ParameterType, ResourceGroup, Vpc } from "./AliyunOperations";
import { AbstractTunnelCreatingService, InstanceConfig, subCidrBlock } from "./AbstractTunnelCreatingService";
import _ from "lodash";
import { promiseAllSync, singletonResult, waitCondition } from "../langUtils";
import { willThrowError } from "./aliyunUtils";

const OOS_SERVICE_ROLE_NAME = "OOSServiceRole";

export default class AutoProvisioningTunnelCreatingService extends AbstractTunnelCreatingService {
  protected async doCreate(
    regionId: string,
    resourceGroup: ResourceGroup,
    vpc: Vpc,
    instanceConfig: InstanceConfig
  ): Promise<string> {
    console.log("Creating elastic ip...");
    const eip = await this.operations.allocateEipAddress(regionId, {
      Bandwidth: instanceConfig.InternetMaxBandwidthOut,
      InstanceChargeType: "PostPaid",
      InternetChargeType: instanceConfig.InternetChargeType,
      ResourceGroupId: resourceGroup.Id,
    });
    console.log("Creating lifecycle OOS services...");
    await this.setupAutoAssignEipTask(regionId, resourceGroup, eip.AllocationId, OOS_SERVICE_ROLE_NAME);
    console.log("Creating auto provisioning group...");
    await this.operations.createAutoProvisioningGroup(regionId, "1", {
      ResourceGroupId: resourceGroup.Id,
      SpotAllocationStrategy: "lowest-price",
      ExcessCapacityTerminationPolicy: "termination",
      TerminateInstancesWithExpiration: "true",
      TerminateInstances: "true",
      PayAsYouGoTargetCapacity: "0",
      SpotTargetCapacity: "1",
      "LaunchConfiguration.ImageId": instanceConfig.ImageId,
      "LaunchConfiguration.SecurityGroupId": instanceConfig.SecurityGroupId,
      "LaunchConfiguration.InternetChargeType": instanceConfig.InternetChargeType,
      "LaunchConfiguration.UserData": instanceConfig.UserData,
      "LaunchConfiguration.SystemDiskCategory": instanceConfig["SystemDisk.Category"],
      "LaunchConfiguration.SystemDiskSize": instanceConfig["SystemDisk.Size"],
      "LaunchConfiguration.ResourceGroupId": resourceGroup.Id,
      ...(await this.generateLaunchTemplateConfig(regionId, vpc, instanceConfig)),
    });
    return eip.EipAddress;
  }

  private async generateLaunchTemplateConfig(
    regionId: string,
    vpc: Vpc,
    instanceConfig: InstanceConfig
  ): Promise<ParameterType> {
    const config: ParameterType = {};
    const zones = await this.operations.describeZones(regionId, {
      InstanceChargeType: instanceConfig.InstanceChargeType,
      SpotStrategy: "SpotAsPriceGo",
    });
    for (let i = 0; i < zones.length; i++) {
      const vSwitch = await this.createVSwitchAvailable(
        subCidrBlock(vpc.CidrBlock, i),
        vpc.VpcId,
        zones[i].ZoneId,
        regionId
      );
      Object.assign(
        config,
        _.mapKeys(
          {
            VSwitchId: vSwitch.VSwitchId,
            InstanceType: "ecs.t5-lc1m1.small",
            WeightedCapacity: "1",
          },
          (v, k) => `LaunchTemplateConfig.${i + 1}.${k}`
        )
      );
    }
    return config;
  }

  private async setupAutoAssignEipTask(
    regionId: string,
    resourceGroup: ResourceGroup,
    allocationId: string,
    ramRole: string
  ): Promise<void> {
    await this.setupOssRamRole(ramRole);
    await this.operations.createTemplate(
      JSON.stringify(template(regionId, resourceGroup.Id, allocationId, ramRole)),
      resourceGroup.Name,
      regionId
    );
    const execution = await this.operations.startExecution(regionId, resourceGroup.Name, { SafetyCheck: "Skip" });
    await waitCondition(
      async () =>
        singletonResult(await this.operations.listExecutions(regionId, { ExecutionId: execution.ExecutionId }))
          .Status === "Waiting"
    );
  }

  private async setupOssRamRole(roleName: string): Promise<void> {
    if (
      await willThrowError(async () => {
        await this.operations.getRole(roleName);
      }, "EntityNotExist.Role")
    ) {
      await this.operations.createRole(
        roleName,
        JSON.stringify({
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: ["oos.aliyuncs.com"],
              },
            },
          ],
          Version: "1",
        })
      );
    }
    const missingPolicies = _.difference(
      ["AliyunECSFullAccess", "AliyunVPCFullAccess", "AliyunEIPFullAccess"],
      (await this.operations.listPoliciesForRole(roleName)).map((p) => p.PolicyName)
    );
    await promiseAllSync(missingPolicies, (p) => this.operations.attachPolicyToRole(p, "System", roleName));
  }
}

function template(RegionId: string, ResourceGroupId: string, AllocationId: string, RamRole: string): any {
  return {
    FormatVersion: "OOS-2019-06-01",
    RamRole,
    Tasks: [
      {
        Name: "waitStateChange",
        Action: "ACS::EventTrigger",
        Properties: {
          Product: "ECS",
          Name: ["Instance:StateChange"],
          Level: ["INFO"],
          Content: { state: "Created" },
        },
        Outputs: {
          instanceId: {
            Type: "String",
            ValueSelector: ".content.resourceId",
          },
        },
      },
      {
        Name: "checkFanqiang",
        Action: "ACS::CheckFor",
        Properties: {
          Service: "ECS",
          API: "DescribeInstances",
          Parameters: {
            InstanceIds: ["{{ waitStateChange.instanceId }}"],
            ResourceGroupId,
          },
          PropertySelector: ".TotalCount",
          DesiredValues: [1],
        },
      },
      {
        Name: "associateEip",
        Action: "ACS::ExecuteAPI",
        Properties: {
          Service: "VPC",
          API: "AssociateEipAddress",
          Parameters: {
            AllocationId,
            InstanceId: "{{ waitStateChange.instanceId }}",
            RegionId,
          },
        },
      },
    ],
  };
}
