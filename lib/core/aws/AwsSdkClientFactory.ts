export class AwsSdkClientFactory<T extends { destroy(): void }> {
  private readonly clientCache: Record<string, T> = {};

  constructor(private readonly clientConstructor: new (config: { region: string }) => T) {}

  create(region: string): T {
    if (!this.clientCache[region]) {
      this.clientCache[region] = new this.clientConstructor({ region });
    }
    return this.clientCache[region];
  }

  dispose(): void {
    Object.values(this.clientCache).forEach((c) => c.destroy());
  }
}
