import { ClashConfigWriter } from "../domain/ClashConfigWriter";
import { ResourceIndexRepository } from "./ResourceIndexRepository";
import axios, { AxiosInstance } from "axios";
import { AliyunOssCloudStorage } from "./aliyun/AliyunOssCloudStorage";
import { AliyunCredentials, loadCredentials } from "./aliyun/aliyunCredentials";
import { AliyunOperations } from "./aliyun/AliyunOperations";
import { AwsS3CloudStorage } from "./aws/AwsS3CloudStorage";
import { AwsSdkClientFactory } from "./aws/AwsSdkClientFactory";
import { LightsailOperations } from "./aws/LightsailOperations";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import { S3Client } from "@aws-sdk/client-s3";
import exitHook from "async-exit-hook";
import { IAMClient } from "@aws-sdk/client-iam";
import { accountName } from "./aws/awsUtils";
import { CreateTunnelProxyFunction, DestroyTunnelProxyFunction } from "../domain/tunnelProxyActionTypes";
import { createTunnelProxy, destroyTunnelProxy } from "./tunnelProxyActions";

export const APP_NAME = "fanqiang";

export interface Configuration {
  httpClient: AxiosInstance;
  cloudServiceProviders: {
    aliyun: {
      credentials: AliyunCredentials;
      operations?: AliyunOperations;
      cloudStorage?: AliyunOssCloudStorage;
    };
    aws: {
      defaultRegion: string;
      lightsailClientFactory: AwsSdkClientFactory<LightsailClient>;
      s3ClientFactory: AwsSdkClientFactory<S3Client>;
      iamClient?: IAMClient;
      lightsailOperations?: LightsailOperations;
      cloudStorage?: AwsS3CloudStorage;
    };
  };
  clashConfigWriter: ClashConfigWriter;

  resourceIndexRepository?: ResourceIndexRepository;
  createTunnelProxy?: CreateTunnelProxyFunction;
  destroyTunnelProxy?: DestroyTunnelProxyFunction;
}

let configuration: Configuration | undefined;

export async function loadConfiguration(): Promise<Configuration> {
  if (!configuration) {
    configuration = await createConfiguration();

    exitHook((done) => {
      console.log("Disposing internal resources...");
      configuration.cloudServiceProviders.aws.lightsailClientFactory.dispose();
      configuration.cloudServiceProviders.aws.s3ClientFactory.dispose();
      configuration.cloudServiceProviders.aws.iamClient?.destroy();
      done();
    });
  }
  return configuration;
}

async function createConfiguration(): Promise<Configuration> {
  const localConfig: Configuration = {
    cloudServiceProviders: {
      aliyun: { credentials: await loadCredentials() },
      aws: {
        defaultRegion: "us-east-2",
        lightsailClientFactory: new AwsSdkClientFactory(LightsailClient),
        s3ClientFactory: new AwsSdkClientFactory(S3Client),
      },
    },
    httpClient: axios.create(),
    clashConfigWriter: new ClashConfigWriter(),
  };
  localConfig.cloudServiceProviders.aliyun.operations = new AliyunOperations(
    localConfig.httpClient,
    localConfig.cloudServiceProviders.aliyun.credentials
  );
  localConfig.cloudServiceProviders.aliyun.cloudStorage = new AliyunOssCloudStorage(
    `${APP_NAME}-${(await localConfig.cloudServiceProviders.aliyun.operations.getUser()).UserId}`,
    localConfig.cloudServiceProviders.aliyun.credentials
  );
  await postProcessAwsConfiguration(localConfig.cloudServiceProviders.aws);
  localConfig.resourceIndexRepository = new ResourceIndexRepository(localConfig.httpClient);
  localConfig.createTunnelProxy = (request) => createTunnelProxy(request, localConfig);
  localConfig.destroyTunnelProxy = () => destroyTunnelProxy(localConfig);

  return localConfig;
}

async function postProcessAwsConfiguration(config: Configuration["cloudServiceProviders"]["aws"]): Promise<void> {
  config.iamClient = new IAMClient({ region: config.defaultRegion });
  config.lightsailOperations = new LightsailOperations(config.lightsailClientFactory);
  config.cloudStorage = new AwsS3CloudStorage(
    `${APP_NAME}.${await accountName(config.iamClient)}`,
    config.s3ClientFactory
  );
}
