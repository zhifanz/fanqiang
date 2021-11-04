import path from "path";
import AdmZip from "adm-zip";

export function createBundle(bundlePath: string): void {
  const zipper = new AdmZip();
  zipper.addLocalFile(path.join(__dirname, "..", "..", "analysis", "index.py"));
  zipper.writeZip(bundlePath);
}
