export type CloudSaveFunction = (key: string, value: string) => Promise<string>;
export type DestroyCloudStorageFunc = () => Promise<void>;

export interface CloudStorage {
  destroy(region: string): Promise<void>;
  putObject(region: string, objectKey: string, content: string): Promise<string>;
}

export function getCloudSave(region: string, cloudStorage: CloudStorage): CloudSaveFunction {
  return (key, value) => cloudStorage.putObject(region, key, value);
}

export function getDestroyCloudStorage(region: string, cloudStorage: CloudStorage): DestroyCloudStorageFunc {
  return () => cloudStorage.destroy(region);
}
