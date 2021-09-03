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
import { invokeIgnoreError, nonNullArray, Strict } from "../langUtils";
import { CloudStorage } from "../CloudStorage";
import { AwsSdkClientFactory } from "./AwsSdkClientFactory";

export class AwsS3CloudStorage implements CloudStorage {
  constructor(private readonly bucket: string, private readonly clientFactory: AwsSdkClientFactory<S3Client>) {}

  async destroy(region: string): Promise<void> {
    const client = this.clientFactory.create(region);
    await invokeIgnoreError(
      async () => {
        const keys = await listObjectKeys(this.bucket, client);
        await client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: keys.map((k) => ({ Key: k })) },
          })
        );
        await client.send(new DeleteBucketCommand({ Bucket: this.bucket }));
      },
      "NoSuchBucket",
      "Bucket does not exists: " + this.bucket
    );
  }

  async putObject(region: string, objectKey: string, content: string): Promise<string> {
    const client = this.clientFactory.create(region);
    try {
      await client.send(new GetBucketLocationCommand({ Bucket: this.bucket }));
    } catch (e) {
      if (e.name !== "NoSuchBucket") {
        throw e;
      }
      await client.send(new CreateBucketCommand({ Bucket: this.bucket, ACL: "public-read" }));
    }

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: content,
        ACL: "public-read",
      })
    );
    return `http://${this.bucket}.s3.amazonaws.com/${objectKey}`;
  }
}

async function listObjectKeys(Bucket: string, client: S3Client): Promise<string[]> {
  let response: ListObjectsV2CommandOutput;
  const params: Strict<ListObjectsV2CommandInput> = { Bucket };
  const objectKeys: string[] = [];
  do {
    response = await client.send(new ListObjectsV2Command(params));
    if (response.KeyCount) {
      objectKeys.push(...nonNullArray(response.Contents?.map((c) => <string>c.Key)));
    }
    params.ContinuationToken = response.NextContinuationToken;
  } while (response.IsTruncated);
  return objectKeys;
}
