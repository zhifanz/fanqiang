import { TunnelServiceSupport } from "./TunnelServiceSupport";
import { waitOperation, willThrowError } from "./aliyunUtils";
import { ResourceGroup } from "./AliyunOperations";
import { promiseAllSync } from "../langUtils";
import { AliyunOssCloudStorage } from "./AliyunOssCloudStorage";

export class TunnelDestroyingService extends TunnelServiceSupport {
  async destroy(regionId: string, resourceGroupName: string): Promise<void> {
    const resourceGroup = await super.findResourceGroup(resourceGroupName);
    if (!resourceGroup) {
      console.log("Resource group does not exist: " + resourceGroupName);
      return;
    }
    console.log("Deleting OOS services...");
    await this.deleteExecutions(regionId, resourceGroup);
    for (const group of await this.operations.describeAutoProvisioningGroups(regionId)) {
      await waitOperation(
        () => this.operations.deleteAutoProvisioningGroup(group.AutoProvisioningGroupId, regionId, false),
        "AutoProvisioningGroup.IncorrectStatus"
      );
    }
    console.log("Deleting ECS instances...");
    await this.operations.deleteInstances(
      (
        await this.operations.describeInstances(regionId, { ResourceGroupId: resourceGroup.Id })
      ).map((i) => i.InstanceId),
      regionId,
      { Force: "true" }
    );
    for (const sg of await this.operations.describeSecurityGroups(regionId, { ResourceGroupId: resourceGroup.Id })) {
      await waitOperation(
        () => this.operations.deleteSecurityGroup(regionId, sg.SecurityGroupId),
        "DependencyViolation"
      );
    }
    console.log("Deleting network infrastructures...");
    for (const vSwitch of await this.operations.describeVSwitches(regionId, { ResourceGroupId: resourceGroup.Id })) {
      await waitOperation(() => this.operations.deleteVSwitch(regionId, vSwitch.VSwitchId), "DependencyViolation");
    }
    for (const vpc of await this.operations.describeVpcs(regionId, { ResourceGroupId: resourceGroup.Id })) {
      await waitOperation(() => this.operations.deleteVpc(vpc.VpcId, regionId), "Forbbiden");
    }
    for (const eip of await this.operations.describeEipAddresses(regionId, { ResourceGroupId: resourceGroup.Id })) {
      await this.operations.releaseEipAddress(eip.AllocationId, regionId);
    }

    await new AliyunOssCloudStorage((await this.operations.getUser()).UserId).destroy(regionId);
  }

  private async deleteExecutions(regionId: string, resourceGroup: ResourceGroup): Promise<void> {
    if (
      await willThrowError(async () => {
        await this.operations.getTemplate(resourceGroup.Name, regionId);
      }, "EntityNotExists.Template")
    ) {
      return;
    }
    const executions = await this.operations.listExecutions(regionId, { TemplateName: resourceGroup.Name });
    await promiseAllSync(executions, (e) => this.operations.cancelExecution(e.ExecutionId, regionId));
    await this.operations.deleteTemplate(resourceGroup.Name, regionId, { AutoDeleteExecutions: "true" });
  }
}
