import { AliyunOperations, ParameterType, ResourceGroup, VSwitch } from "./AliyunOperations";
import { waitCondition } from "../langUtils";

export class TunnelServiceSupport {
  constructor(protected readonly operations: AliyunOperations) {}

  protected async defaultResourceGroup(): Promise<ResourceGroup> {
    const resourceGroups = await this.operations.listResourceGroups();
    let found = resourceGroups.find((g) => g.Name === "fanqiang");
    if (!found) {
      found = await this.operations.createResourceGroup("fanqiang", "Fan Qiang");
    }
    return found;
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
