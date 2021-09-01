import { ResourceIndex } from "./ResourceIndexRepository";

export interface DestroyHandler {
  execute(resourceIndex: ResourceIndex): Promise<void>;
}
