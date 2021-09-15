import yaml from "yaml";
import assert from "assert";

describe("clash", () => {
  it("yaml format", () => {
    const content = yaml.stringify({ a: 1, b: ["b1", "b2"], c: { k: 1 } });
    const expected = `a: 1
b:
  - b1
  - b2
c:
  k: 1
`;
    assert(content === expected);
  });
});
