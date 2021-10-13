import { KeyPair, RemoteInstanceAssertions, runTerraformTest } from "../cloudInitTestHelper";
import { ProxyDefaults } from "../../../lib/core/Configuration";
import * as os from "os";
import * as child_process from "child_process";
import assert = require("assert");

describe("proxy", () => {
  it("child_process", () => {
    const output = child_process.execSync("echo $HOME", { encoding: "utf8" });
    assert(output.trim() == os.homedir());
  });

  it("cloud init", async () => {
    await runTerraformTest(__dirname, async (terraform) => {
      const keyPair = KeyPair.get();

      const applyResult = await terraform.apply({
        region: process.env.FANQIANG_TEST_RPOXY_REGION,
        port: ProxyDefaults.port,
        encryption_algorithm: ProxyDefaults.encryptionAlgorithm,
        public_key: await keyPair.publicKey(),
      });
      const assertions = new RemoteInstanceAssertions(keyPair, "centos", <string>applyResult.public_ip);
      await assertions.assertPortOpen(8388);
      await assertions.assertFileExists("/var/log/shadowsocks/ssserver.log");
    });
  });
});
