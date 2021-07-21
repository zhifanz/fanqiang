import {
  Bundle,
  CreateInstancesCommand,
  CreateInstancesCommandInput,
  DeleteInstanceCommand,
  GetBundlesCommand,
  GetInstanceCommand,
  GetInstanceStateCommand,
  GetRegionsCommand,
  Instance,
  InstanceState,
  LightsailClient,
  NetworkProtocol,
  OpenInstancePublicPortsCommand,
  Operation,
  Region,
} from "@aws-sdk/client-lightsail";

export class AwsLightsailTemplate {
  constructor(private readonly client: LightsailClient) {}

  async createInstance(config: CreateInstancesCommandInput): Promise<void> {
    this.checkOperations(
      await this.client.send(new CreateInstancesCommand(config))
    );
  }

  async deleteInstance(instanceName: string): Promise<void> {
    this.checkOperations(
      await this.client.send(new DeleteInstanceCommand({ instanceName }))
    );
  }

  async openInstancePublicPorts(
    instanceName: string,
    protocol: NetworkProtocol,
    port: number
  ): Promise<void> {
    this.checkOperation(
      await this.client.send(
        new OpenInstancePublicPortsCommand({
          instanceName,
          portInfo: {
            protocol,
            fromPort: port,
            toPort: port,
          },
        })
      )
    );
  }

  async getRegion(): Promise<string> {
    return this.client.config.region();
  }

  async getInstance(instanceName: string): Promise<Instance> {
    return AwsLightsailTemplate.checkNonNull(
      (await this.client.send(new GetInstanceCommand({ instanceName })))
        .instance,
      "Instance not available: " + instanceName
    );
  }

  async getInstanceState(instanceName: string): Promise<InstanceState> {
    return AwsLightsailTemplate.checkNonNull(
      (await this.client.send(new GetInstanceStateCommand({ instanceName })))
        .state,
      "State not available for instance: " + instanceName
    );
  }

  async getRegions(): Promise<Region[]> {
    return AwsLightsailTemplate.checkNonNull(
      (
        await this.client.send(
          new GetRegionsCommand({ includeAvailabilityZones: true })
        )
      ).regions,
      "Regions not available!"
    );
  }

  async getBundles(): Promise<Bundle[]> {
    return AwsLightsailTemplate.checkNonNull(
      (await this.client.send(new GetBundlesCommand({}))).bundles,
      "Bundles not available!"
    );
  }

  private static checkNonNull<E>(e: E | undefined, error: string): E {
    if (!e) {
      throw new Error(error);
    }
    return e;
  }

  private checkOperation(out: { operation?: Operation }): void {
    if (out.operation) {
      this.checkOperations({ operations: [out.operation] });
    }
  }

  private checkOperations(out: { operations?: Operation[] }): void {
    const failedResources = out.operations
      ?.filter((e) => e.errorCode)
      .map((e) => e.resourceType as string);
    if (failedResources?.length) {
      throw new Error("Command failed on resources: " + failedResources.join());
    }
  }
}
