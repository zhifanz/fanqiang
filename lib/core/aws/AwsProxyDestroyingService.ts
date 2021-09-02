import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import { LightsailOperations } from "./LightsailOperations";
import { invokeIgnoreError } from "../langUtils";
import { ProxyServiceSupport } from "./ProxyServiceSupport";

export class AwsProxyDestroyingService extends ProxyServiceSupport {
  constructor(operations: LightsailOperations, private readonly cloudStorage: AwsS3CloudStorage) {
    super(operations);
  }

  async destroy(region: string, instanceName: string): Promise<void> {
    await invokeIgnoreError(() => this.operations.DeleteInstance(region, { instanceName }), "DoesNotExist");
    await this.cloudStorage.destroy(region);
  }
}
