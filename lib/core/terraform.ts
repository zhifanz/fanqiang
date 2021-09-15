import * as child_process from "child_process";
import * as tmp from "tmp";
import * as fs from "fs-extra";
import * as path from "path";
import { AliyunCredentials, asEnvironmentVariables } from "./aliyunCredentials";
import * as util from "util";
import { TunnelProxyCreatingRequest } from "../domain/TunnelProxyOperations";
import * as process from "process";

export function apply(
  request: TunnelProxyCreatingRequest,
  backend: string,
  credentials: AliyunCredentials
): Promise<string> {
  return runInWorkdir(async (workdir) => {
    await replaceTemplate(path.join(workdir, "backend.tf"), { "${bucket}": backend, "${region}": request.proxyRegion });
    await init(workdir, credentials);
    await provisioning(["apply", ...getBaseArgs(request, backend)], workdir, asEnvironmentVariables(credentials));
    return await inspecting(["output", "-raw", "address"], workdir);
  });
}

export function destroy(
  request: TunnelProxyCreatingRequest,
  backend: string,
  credentials: AliyunCredentials
): Promise<void> {
  return runInWorkdir(async (workdir) => {
    await replaceTemplate(path.join(workdir, "backend.tf"), { "${bucket}": backend, "${region}": request.proxyRegion });
    await init(workdir, credentials);
    await provisioning(["destroy", ...getBaseArgs(request, backend)], workdir, asEnvironmentVariables(credentials));
  });
}

async function init(workdir: string, credentials: AliyunCredentials): Promise<void> {
  await provisioning(["init"], workdir, asEnvironmentVariables(credentials));
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

async function runInWorkdir<R>(executeFunc: (workdir: string) => Promise<R>): Promise<R> {
  const workdir = await prepareWorkdir();
  console.log("Copy terraform configuration to: " + workdir);
  try {
    return await executeFunc(workdir);
  } finally {
    await fs.rm(workdir, { force: true, recursive: true });
  }
}

async function prepareWorkdir(): Promise<string> {
  const workdir = tmp.dirSync({ keep: false, unsafeCleanup: true }).name;
  await fs.copy(path.join(__dirname, "..", "..", "terraform"), workdir, { overwrite: true, recursive: true });
  return workdir;
}

async function replaceTemplate(file: string, params: Record<string, string>): Promise<void> {
  const template = file + ".template";
  let content = await fs.readFile(template, "utf8");
  for (const k in params) {
    content = content.replace(k, params[k]);
  }
  await fs.writeFile(file, content);
  await fs.rm(template, { force: true });
}

function getBaseArgs(request: TunnelProxyCreatingRequest, backend: string): string[] {
  return [
    "-auto-approve",
    "-var",
    `proxy_region=${request.proxyRegion}`,
    "-var",
    `tunnel_region=${request.tunnelRegion}`,
    "-var",
    `port=${request.port}`,
    "-var",
    `password=${request.password}`,
    "-var",
    `encryption_algorithm=${request.encryptionAlgorithm}`,
    "-var",
    `bucket=${backend}`,
  ];
}
