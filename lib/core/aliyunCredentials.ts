import Credential from "@alicloud/credentials";
import path from "path";
import * as os from "os";
import { executeWithEnvironment } from "./langUtils";

export type AliyunCredentials = { accessKeyId: string; accessKeySecret: string };

export function loadCredentials(): Promise<AliyunCredentials> {
  return executeWithEnvironment(
    async () => {
      const credential = new Credential();
      if (!credential.credential) {
        throw new Error("Failed to load aliyun credentials!");
      }
      return {
        accessKeyId: await credential.getAccessKeyId(),
        accessKeySecret: await credential.getAccessKeySecret(),
      };
    },
    "ALIBABA_CLOUD_CREDENTIALS_FILE",
    path.join(os.homedir(), ".alibabacloud", "credentials")
  );
}

export function asTerraformEnvironmentVariables(credentials: AliyunCredentials): Record<string, string> {
  return {
    ALICLOUD_ACCESS_KEY: credentials.accessKeyId,
    ALICLOUD_SECRET_KEY: credentials.accessKeySecret,
  };
}
