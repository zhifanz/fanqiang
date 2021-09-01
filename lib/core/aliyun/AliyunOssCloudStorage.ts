import { CloudStorage } from "../../domain/CloudStorage";
import OSS from "ali-oss";
import { getCredentials } from "./credentials";
import { APP_NAME } from "../Configuration";

export class AliyunOssCloudStorage implements CloudStorage {
  private readonly bucket: string;
  constructor(namespace: string) {
    this.bucket = `${APP_NAME}-${namespace}`;
  }

  async destroy(region: string): Promise<void> {
    const client = new OSS({
      ...(await getCredentials()),
      bucket: this.bucket,
      region,
      endpoint: `oss-${region}.aliyuncs.com`,
    });
    try {
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
    } catch (e) {
      if (e.name === "NoSuchBucketError") {
        console.log("Bucket not exists: " + this.bucket);
        return;
      }
      throw e;
    }
  }

  async putObject(region: string, objectKey: string, content: string): Promise<string> {
    const client = new OSS({
      ...(await getCredentials()),
      region,
      endpoint: `oss-${region}.aliyuncs.com`,
    });
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
}
