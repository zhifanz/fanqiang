import { loadConfiguration } from "./core/Configuration";
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
  const response = await configuration.createTunnelProxy({
    ...defaultShadowsockConfig,
    enableCloudStorage: clashConfigRemote,
    proxyRegion: proxyRegion,
    tunnel: tunnelConfig,
  });
  const connectionInfo: TunnelProxyConnectionInfo = { ...defaultShadowsockConfig, address: response.endpoint };
  const clashConfigUrl = clashConfigRemote
    ? await configuration.clashConfigWriter.writeLink(connectionInfo, response.cloudSave)
    : await configuration.clashConfigWriter.writeLocal(connectionInfo);

  console.log("Saved Clash config to: " + clashConfigUrl);
}

export async function destroy(): Promise<void> {
  const configuration = await loadConfiguration();
  await configuration.destroyTunnelProxy();
  console.log("Destroy command run success!");
}
