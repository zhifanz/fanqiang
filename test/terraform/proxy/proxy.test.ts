import { KeyPair, RemoteInstanceAssertions, runTerraformTest } from "../cloudInitTestHelper";
import { DefaultRegions, ProxyDefaults } from "../../../lib/core/Configuration";

describe("proxy", () => {
  it("cloud init", async () => {
    await runTerraformTest(__dirname, async (terraform) => {
      const keyPair = KeyPair.get();

      const applyResult = await terraform.apply({
        region: process.env.FANQIANG_TEST_RPOXY_REGION || DefaultRegions.proxy,
        port: ProxyDefaults.port,
        encryption_algorithm: ProxyDefaults.encryptionAlgorithm,
        public_key: await keyPair.publicKey(),
      });
      const assertions = new RemoteInstanceAssertions(keyPair, "centos", <string>applyResult.public_ip);
      await assertions.assertPortOpen(8388);
    });
  });
});
