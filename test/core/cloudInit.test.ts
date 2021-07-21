import assert from "assert";
import { readCloudInitResource } from "../../lib/core/cloudInit";

describe("cloudInitUtils", () => {
  it("success resolve file path", async () => {
    assert(await readCloudInitResource("proxy-config.sh"));
  });
});
