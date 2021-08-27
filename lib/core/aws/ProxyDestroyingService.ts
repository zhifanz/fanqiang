import { ProxyServiceSupport } from "./ProxyServiceSupport";
import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import { S3Client } from "@aws-sdk/client-s3";

export class ProxyDestroyingService extends ProxyServiceSupport {
  async destroy(instanceName: string, s3Region?: string): Promise<void> {
    try {
      await this.operations.DeleteInstance({ instanceName });
      if (s3Region) {
        await new AwsS3CloudStorage(new S3Client({ region: s3Region })).destroy();
      }
    } catch (e) {
      if (e.name === "DoesNotExist") {
        console.log(e.message);
        return;
      }
      throw e;
    }
  }
}
