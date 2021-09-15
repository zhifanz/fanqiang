export interface Bucket {
  readonly name: string;

  save(objectKey: string, content: string): Promise<string>;
}

export interface CloudStorage {
  getBucket(region: string): Promise<Bucket>;

  destroy(region: string, bucket: string): Promise<void>;
}
