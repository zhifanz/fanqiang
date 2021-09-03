import { TunnelProxyCreatingRequest, TunnelProxyEndpoint } from "../domain/tunnelProxyActionTypes";
import { APP_NAME, Configuration } from "./Configuration";
import { TunnelDestroyingService } from "./aliyun/TunnelDestroyingService";
import { AwsProxyDestroyingService } from "./aws/AwsProxyDestroyingService";
import { ResourceIndex } from "./ResourceIndexRepository";
import { AwsProxyCreatingService } from "./aws/AwsProxyCreatingService";
import { DefaultCreateTunnelHandler } from "./aliyun/DefaultCreateTunnelHandler";
import { getCloudSave } from "./CloudStorage";

export async function createTunnelProxy(
  request: TunnelProxyCreatingRequest,
  configuration: Configuration
): Promise<TunnelProxyEndpoint> {
  const resourceIndex: ResourceIndex = { proxy: { region: request.proxyRegion, instanceName: APP_NAME } };

  let endpoint = await new AwsProxyCreatingService(configuration.cloudServiceProviders.aws.lightsailOperations).create(
    resourceIndex.proxy.region,
    resourceIndex.proxy.instanceName,
    request.port
  );
  if (request.tunnel) {
    resourceIndex.tunnel = { region: request.tunnel.region, resourceGroup: APP_NAME };
    endpoint = await new DefaultCreateTunnelHandler(configuration.cloudServiceProviders.aliyun.operations).execute(
      resourceIndex.tunnel.region,
      resourceIndex.tunnel.resourceGroup,
      endpoint,
      request.port,
      request.tunnel.autoProvisioning
    );
  }
  if (request.enableCloudStorage) {
    await configuration.resourceIndexRepository.save(
      resourceIndex,
      request.tunnel
        ? getCloudSave(request.tunnel.region, configuration.cloudServiceProviders.aliyun.cloudStorage)
        : getCloudSave(request.proxyRegion, configuration.cloudServiceProviders.aws.cloudStorage)
    );
  } else {
    await configuration.resourceIndexRepository.save(resourceIndex);
  }
  return endpoint;
}

export async function destroyTunnelProxy(configuration: Configuration): Promise<void> {
  const resourceIndex = await configuration.resourceIndexRepository.load();
  if (resourceIndex.tunnel) {
    console.log("Destroying tunnel infrastructures...");
    await new TunnelDestroyingService(
      configuration.cloudServiceProviders.aliyun.operations,
      configuration.cloudServiceProviders.aliyun.cloudStorage
    ).destroy(resourceIndex.tunnel.region, resourceIndex.tunnel.resourceGroup);
  }
  console.log("Destroying proxy infrastructures...");
  await new AwsProxyDestroyingService(
    configuration.cloudServiceProviders.aws.lightsailOperations,
    configuration.cloudServiceProviders.aws.cloudStorage
  ).destroy(resourceIndex.proxy.region, resourceIndex.proxy.instanceName);
  console.log("Successfully destroy tunnel proxy!");
}
