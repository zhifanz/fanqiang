import * as fs from "fs-extra";
import * as tmp from "tmp";
import assert = require("assert");

describe("terraform", () => {
  it("fs write json ignore undefined values", () => {
    const file = tmp.fileSync();
    try {
      fs.writeJSONSync(file.name, { k: undefined });
      assert("{}" == fs.readFileSync(file.name, { encoding: "utf8" }).trim());
    } finally {
      file.removeCallback();
    }
  });
});
