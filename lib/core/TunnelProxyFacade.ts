import { ProxyCreatingService } from "./aws/ProxyCreatingService";
import { generateConfigFrom } from "./clash";
import * as fs from "fs-extra";
import { TunnelDestroyingService } from "./aliyun/TunnelDestroyingService";
import { AliyunOperations } from "./aliyun/AliyunOperations";
import axios from "axios";
import { defaultCredentials } from "./aliyun/credentials";
import { TunnelCreatingService } from "./aliyun/TunnelCreatingService";
import { ProxyDestroyingService } from "./aws/ProxyDestroyingService";
import { AliyunOssCloudStorage } from "./aliyun/AliyunOssCloudStorage";
import { AwsS3CloudStorage } from "./aws/AwsS3CloudStorage";
import { CloudStorage } from "./CloudStorage";
import { S3Client } from "@aws-sdk/client-s3";

export class TunnelProxyFacade {
  async createTunnelProxy(
    proxyRegion: string,
    clashConfigPath: string,
    tunnelConfig?: { region: string; arch: string }
  ): Promise<void> {
    console.log(`Creating proxy infrastructures for region [${proxyRegion}]...`);

    const endpoints = await invokeService(new ProxyCreatingService(proxyRegion), (s) => s.create("fanqiang"));
    if (tunnelConfig) {
      console.log(`Creating tunnel infrastructures for region [${tunnelConfig.region}]...`);
      const serviceConstructor = require(`./aliyun/${tunnelConfig.arch}TunnelCreatingService`).default;
      endpoints.ipv4 = (
        await (<TunnelCreatingService>new serviceConstructor(defaultAliyunOperations())).create(tunnelConfig.region, {
          address: endpoints.ipv4,
          family: "ipv4",
          port: endpoints.port,
        })
      ).address;
    }
    console.log("Successfully created tunnel proxy!");
    const configContent = generateConfigFrom(endpoints);
    if (clashConfigPath === "link") {
      const cloudStorage: CloudStorage = tunnelConfig
        ? new AliyunOssCloudStorage(
            defaultCredentials(),
            async () => (await new AliyunOperations(axios.create(), defaultCredentials()).getUser()).UserId
          )
        : new AwsS3CloudStorage(new S3Client({ region: proxyRegion }));
      const link = await cloudStorage.putObject("clash/config.yaml", configContent);
      console.log("Saved Clash config to link: " + link);
    } else {
      await fs.ensureFile(clashConfigPath);
      await fs.writeFile(clashConfigPath, configContent);
      console.log("Saved Clash config to file: " + clashConfigPath);
    }
  }

  async destroyTunnelProxy(proxyRegion: string, tunnelRegion?: string): Promise<void> {
    if (tunnelRegion) {
      console.log("Destroying tunnel infrastructures...");
      await new TunnelDestroyingService(defaultAliyunOperations()).destroy(tunnelRegion);
    }
    console.log("Destroying proxy infrastructures...");
    await invokeService(new ProxyDestroyingService(proxyRegion), (s) =>
      s.destroy("fanqiang", tunnelRegion ? undefined : proxyRegion)
    );
    console.log("Successfully destroy tunnel proxy!");
  }
}

function invokeService<S extends { dispose: () => void }, R>(
  service: S,
  invoker: (service: S) => Promise<R>
): Promise<R> {
  try {
    return invoker(service);
  } finally {
    service.dispose();
  }
}

function defaultAliyunOperations() {
  return new AliyunOperations(axios.create(), defaultCredentials());
}
