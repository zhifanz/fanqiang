import { GetUserCommand, IAMClient } from "@aws-sdk/client-iam";

export const DEFAULT_REGION = "us-east-1";

let cachedAccountId: string | undefined;

export async function defaultBucketName(): Promise<string> {
  return `fanqiang.${await accountId()}`.toLowerCase();
}

export async function accountId(): Promise<string> {
  if (!cachedAccountId) {
    cachedAccountId = <string>(
      (await new IAMClient({ region: DEFAULT_REGION }).send(new GetUserCommand({}))).User?.UserName
    );
  }
  return cachedAccountId;
}
