import { ClashConfigWriter } from "../domain/ClashConfigWriter";
import { ResourceIndexRepository } from "../domain/ResourceIndexRepository";
import { TunnelProxyEndpoints } from "../domain/TunnelProxyEndpoints";
import { CloudStorage } from "../domain/CloudStorage";
import axios from "axios";
import { CreateTunnelHandler } from "../domain/CreateTunnelHandler";
import { AliyunOssCloudStorage } from "./aliyun/AliyunOssCloudStorage";
import { DefaultCreateTunnelHandler } from "./aliyun/DefaultCreateTunnelHandler";
import { getCredentials } from "./aliyun/credentials";
import { AliyunOperations } from "./aliyun/AliyunOperations";
import { AwsS3CloudStorage } from "./aws/AwsS3CloudStorage";
import { DestroyHandler } from "../domain/DestroyHandler";
import { DefaultDestroyHandler } from "./DefaultDestroyHandler";
import { createProxy } from "./aws/ProxyCreatingService";

export const APP_NAME = "fanqiang";

export interface Configuration {
  clashConfigWriter: ClashConfigWriter;

  resourceIndexRepository: ResourceIndexRepository;
  destroyHandler: DestroyHandler;

  createProxy: (region: string, port: number, instanceName: string) => Promise<TunnelProxyEndpoints>;
  createTunnel: CreateTunnelHandler;
  cloudStorageProviders: Record<"proxy" | "tunnel", CloudStorage>;
}

export async function getConfiguration(): Promise<Configuration> {
  const httpClient = axios.create();
  const aliyunCredentials = await getCredentials();
  const aliyunOperations = new AliyunOperations(httpClient, aliyunCredentials);
  return {
    clashConfigWriter: new ClashConfigWriter(),

    resourceIndexRepository: new ResourceIndexRepository(httpClient),
    destroyHandler: new DefaultDestroyHandler(aliyunOperations),
    createProxy: createProxy,
    createTunnel: new DefaultCreateTunnelHandler(aliyunOperations),
    cloudStorageProviders: {
      proxy: new AwsS3CloudStorage(),
      tunnel: new AliyunOssCloudStorage((await aliyunOperations.getUser()).UserId),
    },
  };
}
