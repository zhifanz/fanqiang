export interface CloudStorage {
  destroy(): Promise<void>;
  putObject(objectKey: string, content: string): Promise<string>;
}
