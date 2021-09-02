import { GetUserCommand, IAMClient } from "@aws-sdk/client-iam";

export async function accountName(iamClient: IAMClient): Promise<string> {
  return <string>(await iamClient.send(new GetUserCommand({}))).User?.UserName;
}
