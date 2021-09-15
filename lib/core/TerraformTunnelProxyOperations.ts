import {
  TunnelProxyCreatingRequest,
  TunnelProxyCreatingResult,
  TunnelProxyOperations,
} from "../domain/TunnelProxyOperations";
import * as terraform from "./terraform";
import { Configuration } from "./Configuration";

export class TerraformTunnelProxyOperations implements TunnelProxyOperations {
  constructor(private readonly configuration: Configuration) {}

  async create(request: TunnelProxyCreatingRequest): Promise<TunnelProxyCreatingResult> {
    let storedOptions = await this.configuration.storedOptionsRepository.load();
    if (storedOptions) {
      throw new Error("Tunnel proxy already exists!");
    }
    const bucket = await this.configuration.cloudStorage.getBucket(request.proxyRegion);
    storedOptions = {
      request,
      bucket: bucket.name,
    };
    const endpointAddress = await terraform.apply(
      storedOptions.request,
      storedOptions.bucket,
      this.configuration.aliyun.credentials
    );
    await this.configuration.storedOptionsRepository.save(storedOptions);
    return {
      address: endpointAddress,
      bucket,
    };
  }

  async destroy(): Promise<void> {
    const storedOptions = await this.configuration.storedOptionsRepository.load();
    if (!storedOptions) {
      throw new Error("Tunnel proxy does not exists!");
    }
    await terraform.destroy(storedOptions.request, storedOptions.bucket, this.configuration.aliyun.credentials);
    await this.configuration.cloudStorage.destroy(storedOptions.request.proxyRegion, storedOptions.bucket);
    await this.configuration.storedOptionsRepository.delete();
  }
}
