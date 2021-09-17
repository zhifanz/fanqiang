export interface CloudStorage {
  save(objectKey: string, content: string): Promise<string>;
}
