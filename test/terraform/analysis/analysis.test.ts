import { runTerraformTest, sleep } from "../cloudInitTestHelper";
import { DefaultRegions } from "../../../lib/core/Configuration";
import * as child_process from "child_process";
import * as fs from "fs-extra";
import * as tmp from "tmp";
import assert = require("assert");

const SampleLog =
  `DEBUG shadowsocks_service::server::tcprelay established tcp tunnel [::ffff:139.196.112.14]:39284 <-> baidu.com:443 with ConnectOpts {}
DEBUG shadowsocks_service::server::tcprelay established tcp tunnel [::ffff:139.196.112.14]:39286 <-> spring.io:443 with ConnectOpts {}
`;

describe("analysis", () => {
  it("collect and analyse", async () => {
    const region = process.env.FANQIANG_TEST_RPOXY_REGION || DefaultRegions.proxy;
    const file = tmp.fileSync();
    await fs.writeFile(file.name, "rules: []");
    await runTerraformTest(__dirname, async terraform => {
      const applyResult = await terraform.apply({ region, queue_name: "fanqiang-test", bucket: "fanqiang-test" });
      await sleep(5000);
      const env = {
        ...process.env,
        AWS_ACCESS_KEY_ID: <string>applyResult.aws_access_key_id,
        AWS_SECRET_ACCESS_KEY: <string>applyResult.aws_secret_access_key
      };
      child_process.execSync(
        `python3 ./analysis/collector.py --region=${region} --queue=fanqiang-test`,
        { input: SampleLog, env, encoding: "utf8", stdio: [undefined, "inherit", "inherit"] });

      try {
        child_process.execSync(
          `python3 ./analysis/analyzer.py --region=${region} --queue=fanqiang-test fanqiang-test clash/domain_rules.yaml`,
          { timeout: 60 * 1000, env, stdio: "inherit" });
      } catch (e) {
        if (e.code !== "ETIMEDOUT") {
          throw e;
        }
      }
      const output = child_process.execSync("curl --silent http://fanqiang-test.s3.amazonaws.com/clash/domain_rules.yaml", { encoding: "utf8" });
      assert(output.includes("baidu.com"));
      assert(output.includes("spring.io"));
    });

  });
});
