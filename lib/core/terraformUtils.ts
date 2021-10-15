import { CredentialsProviders } from "./Credentials";

export function asEnvironmentVariables(credentialsProviders: CredentialsProviders): NodeJS.ProcessEnv {
  return {
    ALICLOUD_ACCESS_KEY: credentialsProviders.aliyun.id,
    ALICLOUD_SECRET_KEY: credentialsProviders.aliyun.secret,
    AWS_ACCESS_KEY_ID: credentialsProviders.aws.id,
    AWS_SECRET_ACCESS_KEY: credentialsProviders.aws.secret,
  };
}
