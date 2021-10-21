import * as tar from "tar";
import path from "path";

export async function createBundle(bundlePath: string): Promise<void> {
  await tar.create({
    file: path.join(bundlePath),
    gzip: true,
    cwd: path.join(__dirname, "..", "..", "analysis"),
    filter: p => !p.endsWith("tests.py")
  }, ["."]);

}
