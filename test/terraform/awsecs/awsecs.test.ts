import { runTerraformTest } from "../cloudInitTestHelper";
import { DefaultRegions, ProxyDefaults } from "../../../lib/core/Configuration";
import assert = require("assert");

describe("awsecs", () => {
  it("terraform", async () => {
    await runTerraformTest(__dirname, async terraform => {
      const applyResult = await terraform.apply({
        region: DefaultRegions.proxy,
        port: ProxyDefaults.port
      });
      assert(applyResult.subnet_id);
    })
  })
})
