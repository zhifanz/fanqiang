import { loadConfiguration } from "./core/Configuration";
import { getCloudSave } from "./core/CloudStorage";
import { TunnelProxyConnectionInfo, TunnelProxyCreatingRequest } from "./domain/tunnelProxyActionTypes";
import { randomBytes } from "crypto";

export async function create(
  proxyRegion: string,
  clashConfigRemote: boolean,
  tunnelConfig?: TunnelProxyCreatingRequest["tunnel"]
): Promise<void> {
  const configuration = await loadConfiguration();
  const defaultShadowsockConfig = {
    port: 8388,
    encryptionAlgorithm: "aes-256-gcm",
    password: randomBytes(20).toString("base64"),
  };
  const endpoint = await configuration.createTunnelProxy({
    ...defaultShadowsockConfig,
    enableCloudStorage: clashConfigRemote,
    proxyRegion: proxyRegion,
    tunnel: tunnelConfig,
  });
  const connectionInfo: TunnelProxyConnectionInfo = { ...defaultShadowsockConfig, address: endpoint };
  const clashConfigUrl = clashConfigRemote
    ? await configuration.clashConfigWriter.writeLink(
        connectionInfo,
        tunnelConfig
          ? getCloudSave(tunnelConfig.region, configuration.cloudServiceProviders.aliyun.cloudStorage)
          : getCloudSave(proxyRegion, configuration.cloudServiceProviders.aws.cloudStorage)
      )
    : await configuration.clashConfigWriter.writeLocal(connectionInfo);

  console.log("Saved Clash config to: " + clashConfigUrl);
}

export async function destroy(): Promise<void> {
  const configuration = await loadConfiguration();
  await configuration.destroyTunnelProxy();
  console.log("Destroy command run success!");
}
