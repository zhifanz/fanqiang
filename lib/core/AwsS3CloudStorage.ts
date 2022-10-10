import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { CloudStorage } from "./CloudStorage";

export class AwsS3CloudStorage implements CloudStorage {
  constructor(private readonly region: string, private readonly bucket: string, private readonly domain: string) {}

  async save(objectKey: string, content: string): Promise<string> {
    await runWithClient(this.region, (client) =>
      client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: content,
          ACL: "public-read",
        })
      )
    );
    return `http://${this.domain}/${objectKey}`;
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
