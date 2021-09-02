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
import { findPagedResources } from "../pagedRequests";
import _ from "lodash";
import { AwsSdkClientFactory } from "./AwsSdkClientFactory";

export class LightsailOperations {
  constructor(private readonly clientFactory: AwsSdkClientFactory<LightsailClient>) {}

  private client(region: string): LightsailClient {
    return this.clientFactory.create(region);
  }

  async CreateInstances(region: string, params: Strict<CreateInstancesCommandInput>): Promise<Instance[]> {
    return nonNullArray(
      (await this.client(region).send(new CreateInstancesCommand(params))).operations?.map((o) => <Instance>o)
    );
  }

  async DeleteInstance(region: string, params: Strict<DeleteInstanceCommandInput>): Promise<void> {
    await this.client(region).send(new DeleteInstanceCommand(params));
  }

  async GetInstance(region: string, params: Strict<GetInstanceCommandInput>): Promise<Instance> {
    return <Instance>(await this.client(region).send(new GetInstanceCommand(params))).instance;
  }

  async GetInstanceState(region: string, params: Strict<GetInstanceStateCommandInput>): Promise<InstanceState> {
    return <InstanceState>(await this.client(region).send(new GetInstanceStateCommand(params))).state;
  }

  async OpenInstancePublicPorts(region: string, params: Strict<OpenInstancePublicPortsCommandInput>): Promise<void> {
    await this.client(region).send(new OpenInstancePublicPortsCommand(params));
  }

  async GetBundles(region: string, includeInactive?: boolean): Promise<Bundle[]> {
    const params: Strict<GetBundlesCommandInput> = includeInactive === undefined ? {} : { includeInactive };
    return findPagedResources(
      (pageToken) => this.client(region).send(new GetBundlesCommand(_.merge(params, { pageToken }))),
      (p, r) => r.nextPageToken,
      (r) => !!r.nextPageToken,
      (r) => nonNullArray(r.bundles)
    );
  }

  async GetRegion(region: string, params: Strict<GetRegionsCommandInput>): Promise<Region> {
    return (await this.client(region).send(new GetRegionsCommand(params))).regions.find((r) => r.name === region);
  }
}
