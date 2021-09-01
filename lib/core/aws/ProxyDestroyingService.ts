import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import { invokeDestroyCapable, invokeIgnoreError } from "./awsUtils";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import { AwsLightsailOperations } from "./AwsLightsailOperations";

export class ProxyDestroyingService {
  async destroy(region: string, instanceName: string): Promise<void> {
    return invokeDestroyCapable(new LightsailClient({ region }), async (client) => {
      await invokeIgnoreError(
        () => new AwsLightsailOperations(client).DeleteInstance({ instanceName }),
        "DoesNotExist"
      );
      await new AwsS3CloudStorage().destroy(region);
    });
  }
}
