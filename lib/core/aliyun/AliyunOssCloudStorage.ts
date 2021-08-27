import { CloudStorage } from "../CloudStorage";
import OSS from "ali-oss";
import { AliyunCredentials } from "./credentials";
import { DEFAULT_REGION } from "./aliyunUtils";

export class AliyunOssCloudStorage implements CloudStorage {
  private bucketName: string | undefined;
  private readonly region: string;
  private checked = false;

  constructor(
    private readonly credentials: AliyunCredentials,
    private readonly fetchAccountId: () => Promise<string>,
    region?: string
  ) {
    this.region = region || DEFAULT_REGION;
  }

  async destroy(): Promise<void> {
    const bn = await this.uniqueName();
    try {
      let isTruncated = true;
      while (isTruncated) {
        const result = await this.client().list(null, {});
        await this.client().deleteMulti(
          result.objects.map((o) => o.name),
          { quiet: true }
        );
        isTruncated = result.isTruncated;
      }
      await this.client().deleteBucket(bn);
    } catch (e) {
      if (e.name === "NoSuchBucketError") {
        console.log("Bucket not exists: " + bn);
        return;
      }
      throw e;
    }
  }

  async putObject(objectKey: string, content: string): Promise<string> {
    await this.ensureBucket();
    const url = (await this.client().put(objectKey, Buffer.from(content))).url;
    await this.client().putACL(objectKey, "public-read");
    return url;
  }

  private async ensureBucket(): Promise<void> {
    if (!this.checked) {
      const bn = await this.uniqueName();
      try {
        await this.client().getBucketInfo(bn);
      } catch (e) {
        if (e.name === "") {
          await this.client().putBucket(bn);
          await this.client().putBucketACL(bn, "public-read");
        } else {
          throw e;
        }
      }
    }
    this.checked = true;
  }

  private async uniqueName(): Promise<string> {
    if (!this.bucketName) {
      this.bucketName = `fanqiang-${await this.fetchAccountId()}`;
    }
    return this.bucketName;
  }

  private client(): OSS {
    const config: OSS.Options = {
      ...this.credentials,
      region: this.region,
      endpoint: `oss-${this.region}.aliyuncs.com`,
    };
    if (this.bucketName) {
      config.bucket = this.bucketName;
    }
    return new OSS(config);
  }
}
