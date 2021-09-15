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
import { invokeIgnoreError, nonNullArray, Strict } from "./langUtils";
import { Bucket, CloudStorage } from "../domain/CloudStorage";

export class AwsS3CloudStorage implements CloudStorage {
  async getBucket(region: string): Promise<Bucket> {
    const bucket = `fanqiang${Date.now()}`;
    await runWithClient(region, async (client) => {
      try {
        await client.send(new GetBucketLocationCommand({ Bucket: bucket }));
      } catch (e) {
        if (e.name !== "NoSuchBucket") {
          throw e;
        }
        await client.send(new CreateBucketCommand({ Bucket: bucket, ACL: "public-read" }));
      }
    });

    return {
      name: bucket,
      save: async (objectKey: string, content: string) => {
        await runWithClient(region, (client) =>
          client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: objectKey,
              Body: content,
              ACL: "public-read",
            })
          )
        );
        return `http://${bucket}.s3.amazonaws.com/${objectKey}`;
      },
    };
  }

  async destroy(region: string, bucket: string): Promise<void> {
    await runWithClient(region, (client) =>
      invokeIgnoreError(
        async () => {
          const keys = await listObjectKeys(bucket, client);
          if (keys.length) {
            await client.send(
              new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: keys.map((k) => ({ Key: k })) },
              })
            );
          }
          await client.send(new DeleteBucketCommand({ Bucket: bucket }));
        },
        "NoSuchBucket",
        "Bucket does not exists: " + bucket
      )
    );
  }
}

async function runWithClient<R>(region: string, executeFunc: (client: S3Client) => Promise<R>) {
  const client = new S3Client({ region });
  try {
    return await executeFunc(client);
  } finally {
    client.destroy();
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
