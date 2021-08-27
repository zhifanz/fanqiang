import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  GetBucketLocationCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { nonNullArray, Strict } from "../langUtils";
import { CloudStorage } from "../CloudStorage";
import { accountId } from "./awsUtils";

export class AwsS3CloudStorage implements CloudStorage {
  private checked = false;

  constructor(readonly client: S3Client) {}

  private async ListObjectKeys(Bucket: string): Promise<string[]> {
    let response: ListObjectsV2CommandOutput;
    const params: Strict<ListObjectsV2CommandInput> = { Bucket };
    const objectKeys: string[] = [];
    do {
      response = await this.client.send(new ListObjectsV2Command(params));
      if (response.KeyCount) {
        objectKeys.push(...nonNullArray(response.Contents?.map((c) => <string>c.Key)));
      }
      params.ContinuationToken = response.NextContinuationToken;
    } while (response.IsTruncated);
    return objectKeys;
  }

  async ensureBucket(): Promise<void> {
    if (!this.checked) {
      const Bucket = await bucketName();
      try {
        await this.client.send(new GetBucketLocationCommand({ Bucket }));
      } catch (e) {
        if (e.name === "NoSuchBucket") {
          await this.client.send(new CreateBucketCommand({ Bucket: await bucketName(), ACL: "public-read" }));
        } else {
          throw e;
        }
      }
    }
    this.checked = true;
  }

  async destroy(): Promise<void> {
    const bn = await bucketName();
    try {
      const keys = await this.ListObjectKeys(bn);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: bn,
          Delete: { Objects: keys.map((k) => ({ Key: k })) },
        })
      );
      await this.client.send(new DeleteBucketCommand({ Bucket: bn }));
    } catch (e) {
      if (e.name === "NoSuchBucket") {
        console.log("Bucket does not exists: " + bn);
      } else {
        throw e;
      }
    }
  }

  async putObject(objectKey: string, content: string): Promise<string> {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: await bucketName(),
        Key: objectKey,
        Body: content,
        ACL: "public-read",
      })
    );
    return `http://${await bucketName()}.s3.amazonaws.com/${objectKey}`;
  }
}

async function bucketName(): Promise<string> {
  return `fanqiang.${await accountId()}`.toLowerCase();
}
