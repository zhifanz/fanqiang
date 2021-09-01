import Credential from "@alicloud/credentials";
import path from "path";
import * as os from "os";

export type Credentials = { accessKeyId: string; accessKeySecret: string };

export async function getCredentials(): Promise<Credentials> {
  const ALIBABA_CLOUD_CREDENTIALS_FILE = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
  try {
    process.env.ALIBABA_CLOUD_CREDENTIALS_FILE = path.join(os.homedir(), ".alibabacloud", "credentials");
    const credential = new Credential();
    return {
      accessKeyId: await credential.getAccessKeyId(),
      accessKeySecret: await credential.getAccessKeySecret(),
    };
  } finally {
    process.env.ALIBABA_CLOUD_CREDENTIALS_FILE = ALIBABA_CLOUD_CREDENTIALS_FILE;
  }
}
