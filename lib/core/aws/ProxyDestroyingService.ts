import { ProxyServiceSupport } from "./ProxyServiceSupport";

export class ProxyDestroyingService extends ProxyServiceSupport {
  async destroy(instanceName: string): Promise<void> {
    try {
      await this.operations.DeleteInstance({ instanceName });
    } catch (e) {
      if (e.name === "DoesNotExist") {
        console.log(e.message);
        return;
      }
      throw e;
    }
  }
}
