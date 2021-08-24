import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailOperations } from "./AwsLightsailOperations";

export class ProxyServiceSupport {
  protected readonly operations: AwsLightsailOperations;

  constructor(region: string) {
    this.operations = new AwsLightsailOperations(new LightsailClient({ region }));
  }

  dispose(): void {
    this.operations.client.destroy();
  }
}
