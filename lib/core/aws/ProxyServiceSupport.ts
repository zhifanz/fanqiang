import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailOperations } from "./AwsLightsailOperations";

export class ProxyServiceSupport {
  protected readonly operations: AwsLightsailOperations;

  constructor(client: LightsailClient) {
    this.operations = new AwsLightsailOperations(client);
  }
}
