import { createBundle } from "../../lib/core/analysis";
import { dirSync } from "tmp";
import * as path from "path";
import * as child_process from "child_process";
import * as fs from "fs-extra";
import assert = require("assert");

describe("analysis", () => {
  it("compress", async () => {
    const dir = dirSync({unsafeCleanup: true});
    try
    {
      const file = path.join(dir.name, "analysis.tar.gz");
      await createBundle(file);
      child_process.execSync(`tar --extract --gzip --file=${file} --directory=${dir.name}`);
      assert(fs.pathExistsSync(path.join(dir.name, "analyzer.py")));
      assert(fs.pathExistsSync(path.join(dir.name, "collector.py")));
      assert(fs.pathExistsSync(path.join(dir.name, "common.py")));
      assert(fs.pathExistsSync(path.join(dir.name, "requirements.txt")));
    } finally {
      dir.removeCallback()
    }
  })
})
