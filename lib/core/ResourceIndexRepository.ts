import { AxiosInstance } from "axios";
import * as fs from "fs-extra";
import { APP_NAME } from "./Configuration";
import path from "path";
import * as os from "os";
import { CloudSaveFunction } from "../domain/cloudSave";

export type ResourceIndex = {
  proxy: { region: string; instanceName: string };
  tunnel?: { region: string; resourceGroup: string };
};

export class ResourceIndexRepository {
  constructor(private readonly httpClient: AxiosInstance) {}

  async load(url?: string): Promise<ResourceIndex> {
    if (!url) {
      const contentOrRef = await fs.readJSON(indexFilePath());
      if (!contentOrRef.ref) {
        return <ResourceIndex>contentOrRef;
      }
      url = contentOrRef.ref;
    }
    return (await this.httpClient.get(<string>url)).data;
  }

  async save(resourceIndex: ResourceIndex, cloudSave?: CloudSaveFunction): Promise<void> {
    await fs.ensureFile(indexFilePath());
    if (!cloudSave) {
      await fs.writeJson(indexFilePath(), resourceIndex);
      return;
    }
    const url = await cloudSave("fanqiang/resources.json", JSON.stringify(resourceIndex));
    await fs.writeJson(indexFilePath(), { ref: url });
  }
}

function indexFilePath(): string {
  return path.join(os.homedir(), ".config", APP_NAME, "resources.json");
}
