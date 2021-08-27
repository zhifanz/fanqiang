import {
  Bundle,
  CreateInstancesCommand,
  CreateInstancesCommandInput,
  DeleteInstanceCommand,
  DeleteInstanceCommandInput,
  GetBundlesCommand,
  GetBundlesCommandInput,
  GetInstanceCommand,
  GetInstanceCommandInput,
  GetInstanceStateCommand,
  GetRegionsCommand,
  GetRegionsCommandInput,
  Instance,
  InstanceState,
  LightsailClient,
  OpenInstancePublicPortsCommand,
  Region,
} from "@aws-sdk/client-lightsail";
import { OpenInstancePublicPortsCommandInput } from "@aws-sdk/client-lightsail/commands/OpenInstancePublicPortsCommand";
import { GetInstanceStateCommandInput } from "@aws-sdk/client-lightsail/commands/GetInstanceStateCommand";
import { nonNullArray, Strict } from "../langUtils";
import { findPagedResources } from "../cloudServiceOperations";
import _ from "lodash";

export class AwsLightsailOperations {
  constructor(readonly client: LightsailClient) {}

  async CreateInstances(params: Strict<CreateInstancesCommandInput>): Promise<Instance[]> {
    return nonNullArray(
      (await this.client.send(new CreateInstancesCommand(params))).operations?.map((o) => <Instance>o)
    );
  }

  async DeleteInstance(params: Strict<DeleteInstanceCommandInput>): Promise<void> {
    await this.client.send(new DeleteInstanceCommand(params));
  }

  async GetInstance(params: Strict<GetInstanceCommandInput>): Promise<Instance> {
    return <Instance>(await this.client.send(new GetInstanceCommand(params))).instance;
  }

  async GetInstanceState(params: Strict<GetInstanceStateCommandInput>): Promise<InstanceState> {
    return <InstanceState>(await this.client.send(new GetInstanceStateCommand(params))).state;
  }

  async OpenInstancePublicPorts(params: Strict<OpenInstancePublicPortsCommandInput>): Promise<void> {
    await this.client.send(new OpenInstancePublicPortsCommand(params));
  }

  async GetBundles(includeInactive?: boolean): Promise<Bundle[]> {
    const params: Strict<GetBundlesCommandInput> = includeInactive === undefined ? {} : { includeInactive };
    return findPagedResources(
      (pageToken) => this.client.send(new GetBundlesCommand(_.merge(params, { pageToken }))),
      (p, r) => r.nextPageToken,
      (r) => !!r.nextPageToken,
      (r) => nonNullArray(r.bundles)
    );
  }

  async GetRegions(param: Strict<GetRegionsCommandInput>): Promise<Region[]> {
    return nonNullArray((await this.client.send(new GetRegionsCommand(param))).regions);
  }

  async GetRegion(params: Strict<GetRegionsCommandInput>): Promise<Region> {
    const regionId = await this.client.config.region();
    return <Region>(await this.GetRegions(params)).find((r) => r.name === regionId);
  }
}
