import * as path from "path";
import * as fs from "fs-extra";

export function readCloudInitResource(filename: string): Promise<string> {
  return fs.readFile(resolveCloudInitResource(filename), { encoding: "utf8" });
}

function resolveCloudInitResource(fileName: string) {
  return path.resolve(__dirname, "../../cloud-init", fileName);
}
