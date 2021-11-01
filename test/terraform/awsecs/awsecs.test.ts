import { runTerraformTest } from "../cloudInitTestHelper";
import { DefaultRegions, ProxyDefaults } from "../../../lib/core/Configuration";
import { waitServiceAvailable } from "../../../lib/core/netUtils";

describe("awsecs", () => {
  it("terraform", async () => {
    await runTerraformTest(__dirname, async terraform => {
      const applyResult = await terraform.apply({
        region: DefaultRegions.proxy,
        port: ProxyDefaults.port
      });
      await waitServiceAvailable(ProxyDefaults.port, <string>applyResult.public_ip);
    })
  })
})
