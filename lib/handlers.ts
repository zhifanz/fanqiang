import { APP_NAME, getConfiguration } from "./core/Configuration";
import { ResourceIndex } from "./domain/ResourceIndexRepository";
import { CloudSaveFunc, getCloudSave } from "./domain/CloudStorage";

export async function create(
  proxyRegion: string,
  clashConfigRemote: boolean,
  tunnelConfig?: { region: string; autoProvisioning: boolean }
): Promise<void> {
  const configuration = await getConfiguration();
  const resourceIndex: ResourceIndex = { proxy: { region: proxyRegion, instanceName: APP_NAME } };
  const endpoints = await configuration.createProxy(resourceIndex.proxy.region, 8388, resourceIndex.proxy.instanceName);
  if (tunnelConfig) {
    const resourceGroup = APP_NAME;
    const tunnelAddressInfo = await configuration.createTunnel.execute(
      tunnelConfig.region,
      resourceGroup,
      endpoints,
      tunnelConfig.autoProvisioning
    );
    endpoints.address = tunnelAddressInfo.address;
    resourceIndex.tunnel = { region: tunnelConfig.region, resourceGroup };
  }
  let clashConfigUrl: string | undefined;
  if (clashConfigRemote) {
    const cloudSave: CloudSaveFunc = resourceIndex.tunnel
      ? getCloudSave(resourceIndex.tunnel.region, configuration.cloudStorageProviders.tunnel)
      : getCloudSave(resourceIndex.proxy.region, configuration.cloudStorageProviders.proxy);
    await configuration.resourceIndexRepository.save(resourceIndex, cloudSave);
    clashConfigUrl = await configuration.clashConfigWriter.writeLink(endpoints, cloudSave);
  } else {
    await configuration.resourceIndexRepository.save(resourceIndex);
    clashConfigUrl = await configuration.clashConfigWriter.writeLocal(endpoints);
  }
  console.log("Saved Clash config to: " + clashConfigUrl);
}

export async function destroy(url?: string): Promise<void> {
  const configuration = await getConfiguration();
  await configuration.destroyHandler.execute(await configuration.resourceIndexRepository.load(url));
  console.log("Destroy command run success!");
}
