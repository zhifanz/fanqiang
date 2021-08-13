import { LightsailClient } from "@aws-sdk/client-lightsail";
import { defaultConfig } from "../../../lib/core/aws/AwsLightsailProxyConfig";
import assert from "assert";
import { AwsLightsailTemplate } from "../../../lib/core/aws/AwsLightsailTemplate";
import { DEFAULT_REGION } from "../../../lib/core/aws/regions";

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
