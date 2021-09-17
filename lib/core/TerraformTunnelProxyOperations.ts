import {
  TunnelProxyCreatingRequest,
  TunnelProxyCreatingResult,
  TunnelProxyOperations,
} from "../domain/TunnelProxyOperations";
import * as terraform from "./terraform";
import { Configuration } from "./Configuration";
import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import * as fs from "fs-extra";

export class TerraformTunnelProxyOperations implements TunnelProxyOperations {
  constructor(private readonly configuration: Configuration) {}

  async create(request: TunnelProxyCreatingRequest): Promise<TunnelProxyCreatingResult> {
    const applyResult = await terraform.apply(
      request,
      this.configuration.terraformWorkspace,
      this.configuration.aliyun.credentials
    );
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
