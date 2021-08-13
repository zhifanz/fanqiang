import { CreateInstancesCommandInput, IpAddressType } from "@aws-sdk/client-lightsail";
import { AwsLightsailTemplate } from "./AwsLightsailTemplate";
import { ProxyConfig } from "../../domain/ProxyConfig";
import { randomBytes } from "crypto";

type ValueRequired<T> = { [P in keyof T]-?: NonNullable<T[P]> };

export type AwsLightsailProxyConfig = Pick<
  ValueRequired<CreateInstancesCommandInput>,
  "availabilityZone" | "blueprintId" | "bundleId" | "ipAddressType"
> &
  ProxyConfig & { instanceName: string };

export const DEFAULT_INSTANCE_NAME = "fanqiang-proxy-1";

export async function defaultConfig(template: AwsLightsailTemplate): Promise<AwsLightsailProxyConfig> {
  return {
    availabilityZone: await defaultZone(template),
    blueprintId: "amazon_linux_2",
    bundleId: await defaultBundle(template),
    ipAddressType: IpAddressType.DUALSTACK,
    instanceName: DEFAULT_INSTANCE_NAME,
    port: 8388,
    encryptionAlgorithm: "aes-256-gcm",
    password: generatePassword(),
  };
}

async function defaultZone(template: AwsLightsailTemplate): Promise<string> {
  const thisRegion = await template.getRegion();
  const zones = (await template.getRegions())
    .find((e) => e.name === thisRegion)
    ?.availabilityZones?.map((e) => e.zoneName);
  if (zones?.length) {
    return zones[0] as string;
  }
  throw new Error("No available zones!");
}

async function defaultBundle(template: AwsLightsailTemplate): Promise<string> {
  const bundles = (await template.getBundles())
    .filter((e) => e.price && e.bundleId)
    .sort((a, b) => (a.price as number) - (b.price as number))
    .map((e) => e.bundleId);

  if (bundles?.length) {
    return bundles[0] as string;
  }
  throw new Error("No available bundle!");
}

function generatePassword(): string {
  return randomBytes(20).toString("base64");
}
