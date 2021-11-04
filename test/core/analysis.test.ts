import { createBundle } from "../../lib/core/analysis";
import { dirSync } from "tmp";
import * as path from "path";
import * as fs from "fs-extra";
import assert = require("assert");

describe("analysis", () => {
  it("compress", async () => {
    const dir = dirSync({unsafeCleanup: true});
    try
    {
      const file = path.join(dir.name, "index.zip");
      await createBundle(file);
      assert(fs.pathExistsSync(file));
    } finally {
      dir.removeCallback()
    }
  })
})
