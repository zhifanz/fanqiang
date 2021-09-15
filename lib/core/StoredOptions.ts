import { TunnelProxyCreatingRequest } from "../domain/TunnelProxyOperations";
import * as fs from "fs-extra";

export interface StoredOptions {
  bucket: string;
  request: TunnelProxyCreatingRequest;
}

export interface StoredOptionsRepository {
  save(storedOptions: StoredOptions): Promise<void>;
  load(): Promise<StoredOptions | undefined>;
  delete(): Promise<void>;
}

export class LocalFileStoredOptionsRepository implements StoredOptionsRepository {
  constructor(private readonly filePath: string) {}

  async delete(): Promise<void> {
    try {
      await fs.rm(this.filePath, { force: true });
    } catch (e) {
      console.log(e.message);
    }
  }

  async load(): Promise<StoredOptions | undefined> {
    if (!(await fs.pathExists(this.filePath))) {
      return undefined;
    }
    return await fs.readJSON(this.filePath);
  }

  async save(storedOptions: StoredOptions): Promise<void> {
    await fs.ensureFile(this.filePath);
    await fs.writeJson(this.filePath, storedOptions);
  }
}
