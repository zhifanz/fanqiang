import { KeyPair, RemoteInstanceAssertions, runTerraformTest } from "../cloudInitTestHelper";
import { DefaultRegions, ProxyDefaults } from "../../../lib/core/Configuration";

describe("tunnel", () => {
  it("cloud init", async () => {
    await runTerraformTest(__dirname, async (terraform) => {
      const keyPair = KeyPair.get();
      const applyResult = await terraform.apply({
        proxy_port: ProxyDefaults.port,
        proxy_public_ip: "8.8.8.8",
        region: process.env.FANQIANG_TEST_TUNNEL_REGION || DefaultRegions.tunnel,
        public_key: await keyPair.publicKey(),
      });
      const assertions = new RemoteInstanceAssertions(keyPair, "root", <string>applyResult.public_ip);
      await assertions.assertPortOpen(ProxyDefaults.port);
      await assertions.assertFileExists("/var/log/nginx/error.log");
    });
  });
});
