import { CloudStorage } from "../../domain/CloudStorage";
import OSS from "ali-oss";
import { AliyunCredentials } from "./aliyunCredentials";
import { invokeIgnoreError } from "../langUtils";

export class AliyunOssCloudStorage implements CloudStorage {
  constructor(private readonly bucket: string, private readonly credentials: AliyunCredentials) {}

  async destroy(region: string): Promise<void> {
    const client = this.createClient(region);
    client.useBucket(this.bucket);
    await invokeIgnoreError(
      async () => {
        let isTruncated = true;
        while (isTruncated) {
          const result = await client.list(null, {});
          await client.deleteMulti(
            result.objects.map((o) => o.name),
            { quiet: true }
          );
          isTruncated = result.isTruncated;
        }
        await client.deleteBucket(this.bucket);
      },
      "NoSuchBucketError",
      "Bucket not exists: " + this.bucket
    );
  }

  async putObject(region: string, objectKey: string, content: string): Promise<string> {
    const client = this.createClient(region);
    try {
      await client.getBucketInfo(this.bucket);
    } catch (e) {
      if (e.name !== "NoSuchBucketError") {
        throw e;
      }
      await client.putBucket(this.bucket);
      await client.putBucketACL(this.bucket, "public-read");
    }
    client.useBucket(this.bucket);

    const url = (await client.put(objectKey, Buffer.from(content))).url;
    await client.putACL(objectKey, "public-read");
    return url;
  }

  private createClient(region: string): OSS {
    return new OSS({ ...this.credentials, region, endpoint: `oss-${region}.aliyuncs.com` });
  }
}
