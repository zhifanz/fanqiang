import {
  TunnelProxyCreatingRequest,
  TunnelProxyCreatingResult,
  TunnelProxyOperations,
} from "../domain/TunnelProxyOperations";
import * as terraform from "./terraform";
import { Configuration } from "./Configuration";
import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import * as fs from "fs-extra";
import * as net from "net";
import promiseRetry from "promise-retry";

export class TerraformTunnelProxyOperations implements TunnelProxyOperations {
  constructor(private readonly configuration: Configuration) {}

  async create(request: TunnelProxyCreatingRequest): Promise<TunnelProxyCreatingResult> {
    const applyResult = await terraform.apply(
      request,
      this.configuration.terraformWorkspace,
      this.configuration.aliyun.credentials
    );
    await promiseRetry(async (retry) => {
      try {
        await checkServiceAvailable(request.port, applyResult.address, 2000);
      } catch (error) {
        console.log("Service is not ready, waiting...");
        retry(error);
      }
    });
    return {
      address: applyResult.address,
      cloudStorage: new AwsS3CloudStorage(request.proxyRegion, request.bucket, applyResult.bucketDomain),
    };
  }

  async destroy(): Promise<void> {
    await terraform.destroy(this.configuration.terraformWorkspace, this.configuration.aliyun.credentials);
    await fs.rm(this.configuration.terraformWorkspace, { force: true, recursive: true });
  }
}

async function checkServiceAvailable(port: number, host: string, timeout: number): Promise<void> {
  const socket = net.connect({ port, host, family: 4, timeout });
  try {
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("timeout", () => reject("timeout"));
      socket.once("error", (err) => reject(err));
    });
  } finally {
    socket.destroy();
  }
}
