import { LightsailClient } from "@aws-sdk/client-lightsail";
import { defaultConfig } from "../../lib/core/AwsLightsailProxyConfig";
import assert from "assert";
import { AwsLightsailTemplate } from "../../lib/core/AwsLightsailTemplate";
import { DEFAULT_REGION } from "../../lib/core/awsRegions";

describe("AwsLightsailDefaultValueProvider", () => {
  const client = new LightsailClient({ region: DEFAULT_REGION });
  it("check default config", async () => {
    const config = await defaultConfig(new AwsLightsailTemplate(client));
    assert(config.bundleId === "nano_2_0");
  });

  after(() => {
    client.destroy();
  });
});
