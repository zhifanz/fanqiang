import { AliyunOperations, ParameterType, ResourceGroup, VSwitch } from "./AliyunOperations";
import { waitCondition } from "../langUtils";

export class TunnelServiceSupport {
  constructor(protected readonly operations: AliyunOperations) {}

  protected async ensureResourceGroup(resourceGroupName: string): Promise<ResourceGroup> {
    let found = await this.findResourceGroup(resourceGroupName);
    if (!found) {
      found = await this.operations.createResourceGroup(resourceGroupName, resourceGroupName);
    }
    return found;
  }

  protected async findResourceGroup(resourceGroupName: string): Promise<ResourceGroup | undefined> {
    return (await this.operations.listResourceGroups()).find((g) => g.Name === resourceGroupName);
  }

  protected async createVSwitchAvailable(
    CidrBlock: string,
    VpcId: string,
    ZoneId: string,
    RegionId: string,
    params: ParameterType = {}
  ): Promise<VSwitch> {
    const vSwitch = await this.operations.createVSwitch(CidrBlock, VpcId, ZoneId, RegionId, params);
    await waitCondition(
      async () => (await this.operations.describeVSwitchAttributes(RegionId, vSwitch.VSwitchId)).Status === "Available"
    );
    return vSwitch;
  }
}
