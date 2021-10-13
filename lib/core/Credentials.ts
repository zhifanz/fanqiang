import AliyunCredentials from "@alicloud/credentials";
import path from "path";
import * as os from "os";
import { fromEnv, fromIni } from "@aws-sdk/credential-providers";
import { Credentials as AwsCredentials } from "@aws-sdk/types";

export type Credentials = { id: string; secret: string };
export type CredentialsProviders = {
  aliyun?: Credentials;
  aws?: Credentials;
};
process.env.ALIBABA_CLOUD_CREDENTIALS_FILE = path.join(os.homedir(), ".alibabacloud", "credentials");

export function parseCredentialsToken(token: string): Credentials {
  const splitIndex = token.indexOf(":");
  if (splitIndex < 0) {
    throw new Error("Illegal credentials token format!");
  }
  return {
    id: token.substring(0, splitIndex),
    secret: token.substring(splitIndex + 1),
  };
}

export async function getCredentialsProviders(): Promise<CredentialsProviders> {
  return {
    aliyun: await fromAliyunProviderChain(),
    aws: await fromAwsProviderChain(),
  };
}

async function fromAliyunProviderChain(): Promise<Credentials | undefined> {
  const aliyunCredentials = new AliyunCredentials();
  return aliyunCredentials.credential
    ? {
        id: await aliyunCredentials.getAccessKeyId(),
        secret: await aliyunCredentials.getAccessKeySecret(),
      }
    : undefined;
}

async function fromAwsProviderChain(): Promise<Credentials | undefined> {
  let awsCredentials: AwsCredentials;
  try {
    awsCredentials = await fromEnv()();
  } catch (e1) {
    try {
      awsCredentials = await fromIni()();
      // eslint-disable-next-line no-empty
    } catch (e2) {}
  }

  return awsCredentials ? { id: awsCredentials.accessKeyId, secret: awsCredentials.secretAccessKey } : undefined;
}
