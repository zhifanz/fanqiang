import { runTerraformTest } from "../cloudInitTestHelper";
import { DefaultRegions } from "../../../lib/core/Configuration";
import * as tmp from "tmp";
import { createBundle } from "../../../lib/core/analysis";
import axios from "axios";
import assert = require("assert");

describe("analysis", () => {
  it("aliyun fc", async () => {
    const file = tmp.fileSync();
    createBundle(file.name);

    await runTerraformTest(__dirname, async terraform => {
      const applyResult = await terraform.apply({ region: DefaultRegions.tunnel,  lib_path: file.name});
      const client = axios.create({baseURL: <string>applyResult.fc_endpoint});

      let response = await client.get("?baidu.com");
      assert(response.data === "success");
      response = await client.get("?google.com");
      assert(response.data === "failed");
      response = await client.get("?unknown");
      assert(response.data === "failed");
    });

  });
});
