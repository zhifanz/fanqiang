import {
  TunnelProxyCreatingRequest,
  TunnelProxyCreatingResult,
  TunnelProxyOperations,
} from "../domain/TunnelProxyOperations";
import { Configuration } from "./Configuration";
import { AwsS3CloudStorage } from "./AwsS3CloudStorage";
import * as fs from "fs-extra";
import { waitServiceAvailable } from "./netUtils";
import path from "path";
import Terraform from "./Terraform";
import { asEnvironmentVariables } from "./terraformUtils";

const TerraformConfigSource = path.resolve(__dirname, "..", "..", "terraform");

export class TerraformTunnelProxyOperations implements TunnelProxyOperations {
  constructor(private readonly configuration: Configuration) {}

  async create(request: TunnelProxyCreatingRequest): Promise<TunnelProxyCreatingResult> {
    const terraform = await Terraform.createInstance(
      TerraformConfigSource,
      asEnvironmentVariables(this.configuration.credentialsProviders),
      this.configuration.terraformWorkspace
    );

    const applyResult: { tunnel_public_ip: string; bucket_domain_name: string } = await terraform.apply({
      proxy_region: request.proxyRegion,
      tunnel_region: request.tunnelRegion,
      port: request.port,
      password: request.password,
      encryption_algorithm: request.encryptionAlgorithm,
      bucket: request.bucket,
      public_key: request.publicKey,
    });
    await waitServiceAvailable(request.port, applyResult.tunnel_public_ip);
    return {
      address: applyResult.tunnel_public_ip,
      cloudStorage: new AwsS3CloudStorage(request.proxyRegion, request.bucket, applyResult.bucket_domain_name),
    };
  }

  async destroy(): Promise<void> {
    const terraform = await Terraform.createInstance(
      TerraformConfigSource,
      asEnvironmentVariables(this.configuration.credentialsProviders),
      this.configuration.terraformWorkspace
    );
    await terraform.destroy();
    console.log("Removing terraform working directory...");
    await fs.rm(this.configuration.terraformWorkspace, { force: true, recursive: true });
  }
}
