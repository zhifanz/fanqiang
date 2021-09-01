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
import { CloudStorage } from "../../domain/CloudStorage";
import { accountId, invokeDestroyCapable, invokeIgnoreError } from "./awsUtils";
import { APP_NAME } from "../Configuration";

export class AwsS3CloudStorage implements CloudStorage {
  async destroy(region: string): Promise<void> {
    return invokeDestroyCapable(new S3Client({ region }), async (client) => {
      const Bucket = await bucketName();
      await invokeIgnoreError(
        async () => {
          const keys = await listObjectKeys(Bucket, client);
          await client.send(
            new DeleteObjectsCommand({
              Bucket,
              Delete: { Objects: keys.map((k) => ({ Key: k })) },
            })
          );
          await client.send(new DeleteBucketCommand({ Bucket: Bucket }));
        },
        "NoSuchBucket",
        "Bucket does not exists: " + Bucket
      );
    });
  }

  putObject(region: string, objectKey: string, content: string): Promise<string> {
    return invokeDestroyCapable(new S3Client({ region }), async (client) => {
      const Bucket = await bucketName();
      try {
        await client.send(new GetBucketLocationCommand({ Bucket }));
      } catch (e) {
        if (e.name !== "NoSuchBucket") {
          throw e;
        }
        await client.send(new CreateBucketCommand({ Bucket, ACL: "public-read" }));
      }

      await client.send(
        new PutObjectCommand({
          Bucket,
          Key: objectKey,
          Body: content,
          ACL: "public-read",
        })
      );
      return `http://${await bucketName()}.s3.amazonaws.com/${objectKey}`;
    });
  }
}

async function bucketName(): Promise<string> {
  return `${APP_NAME}.${await accountId()}`.toLowerCase();
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
