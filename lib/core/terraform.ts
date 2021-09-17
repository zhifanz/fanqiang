import * as child_process from "child_process";
import { AliyunCredentials, asTerraformEnvironmentVariables } from "./aliyunCredentials";
import * as util from "util";
import { TunnelProxyCreatingRequest } from "../domain/TunnelProxyOperations";
import * as process from "process";
import * as fs from "fs-extra";
import * as path from "path";

export async function apply(
  request: TunnelProxyCreatingRequest,
  workdir: string,
  credentials: AliyunCredentials
): Promise<{ address: string; bucketDomain: string }> {
  await init(request, workdir);
  await provisioning(["apply", "-auto-approve"], workdir, asTerraformEnvironmentVariables(credentials));
  return {
    address: await inspecting(["output", "-raw", "address"], workdir),
    bucketDomain: await inspecting(["output", "-raw", "bucket_domain_name"], workdir),
  };
}

export async function destroy(workdir: string, credentials: AliyunCredentials): Promise<void> {
  if (!(await fs.pathExists(workdir))) {
    console.log("Tunnel proxy never created, nothing to destroy");
    return;
  }
  await provisioning(["destroy", "-auto-approve"], workdir, asTerraformEnvironmentVariables(credentials));
}

async function init(request: TunnelProxyCreatingRequest, workdir: string): Promise<void> {
  await fs.ensureDir(workdir);
  await fs.writeJson(path.join(workdir, "terraform.tfvars.json"), {
    proxy_region: request.proxyRegion,
    tunnel_region: request.tunnelRegion,
    port: request.port,
    password: request.password,
    encryption_algorithm: request.encryptionAlgorithm,
    bucket: request.bucket,
  });
  if (!(await fs.pathExists(path.join(workdir, ".terraform")))) {
    await fs.copy(path.resolve(__dirname, "..", "..", "terraform"), workdir, { overwrite: true, recursive: true });
    await provisioning(["init"], workdir);
  }
}

async function provisioning(args: string[], cwd: string, customEnv: Record<string, string> = {}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const p = child_process.spawn("terraform", args, { cwd, stdio: "inherit", env: { ...process.env, ...customEnv } });
    p.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject("error code: " + code);
      }
    });
    p.on("error", reject);
  });
}

async function inspecting(args: string[], cwd: string): Promise<string> {
  return (await util.promisify(child_process.execFile)("terraform", args, { cwd })).stdout;
}
