import { Configuration, loadConfiguration, ProxyDefaults } from "./core/Configuration";
import { randomBytes } from "crypto";

import { CredentialsProviders, parseCredentialsToken } from "./core/Credentials";
import { InfrastructureOptions } from "./domain/TunnelProxyOperations";

type StringCredentialsProviders = Record<keyof CredentialsProviders, string>;

export async function create(
  infrastructureOptions: InfrastructureOptions,
  credentials?: StringCredentialsProviders
): Promise<void> {
  await runCommand(async (configuration) => {
    const request = {
      ...infrastructureOptions,
      ...ProxyDefaults,
      password: randomBytes(20).toString("base64"),
    };
    const clashConfigUrl = await configuration.tunnelProxyOperations.create(request);
    console.log("Saved Clash config to: " + clashConfigUrl);
  }, credentials);
}

export async function destroy(credentials?: StringCredentialsProviders): Promise<void> {
  await runCommand(async (configuration) => {
    await configuration.tunnelProxyOperations.destroy();
    console.log("Successfully destroyed tunnel proxy infrastructures!");
  }, credentials);
}

async function runCommand(
  callback: (configuration: Configuration) => Promise<void>,
  credentials?: StringCredentialsProviders
) {
  const configuration = await loadConfiguration();
  if (credentials?.aws) {
    configuration.credentialsProviders.aws = parseCredentialsToken(credentials.aws);
  }
  if (credentials?.aliyun) {
    configuration.credentialsProviders.aliyun = parseCredentialsToken(credentials.aliyun);
  }
  await callback(configuration);
}
