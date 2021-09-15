import { loadConfiguration } from "./core/Configuration";
import { randomBytes } from "crypto";
import { generateConfigFrom } from "./domain/Clash";

export async function create(proxyRegion: string, tunnelRegion: string): Promise<void> {
  const configuration = await loadConfiguration();

  const request = {
    proxyRegion,
    tunnelRegion,
    port: 8388,
    encryptionAlgorithm: "aes-256-gcm",
    password: randomBytes(20).toString("base64"),
  };
  const result = await configuration.tunnelProxyOperations.create(request);

  const clashConfigUrl = await result.bucket.save(
    "clash/config.yaml",
    generateConfigFrom({ ...request, address: result.address })
  );
  console.log("Saved Clash config to: " + clashConfigUrl);
}

export async function destroy(): Promise<void> {
  const configuration = await loadConfiguration();
  await configuration.tunnelProxyOperations.destroy();
  console.log("Successfully destroyed tunnel proxy infrastructures!");
}
