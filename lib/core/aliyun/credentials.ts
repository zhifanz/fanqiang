import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import os from "os";

export type AliyunCredentials = { accessKeyId: string; accessKeySecret: string };

export function defaultCredentials(): AliyunCredentials {
  return dotenv.parse(fs.readFileSync(path.join(os.homedir(), ".aliyun", "credentials"), { encoding: "utf8" }));
}
