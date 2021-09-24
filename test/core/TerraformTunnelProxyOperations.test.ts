import net from "net";
import assert = require("assert");

describe("TerraformTunnelProxyOperations", () => {
  describe("socket events", () => {
    it("connect", async () => {
      const socket = net.connect({ port: 443, host: "nodejs.org" });
      try {
        await handleEvent("connect", socket);
      } finally {
        socket.destroy();
      }
    });
    it("timeout", async () => {
      const socket = net.connect({ port: 443, host: "about.google", timeout: 1 });
      try {
        await handleEvent("timeout", socket);
      } finally {
        socket.destroy();
      }
    });
    it("error", async () => {
      const socket = net.connect({ port: 10000, host: "127.0.0.1" });
      try {
        await handleEvent("error", socket);
        assert.fail("Should throw exception");
      } catch (e) {
        assert(e.message);
      } finally {
        socket.destroy();
      }
    });
  });
});

function handleEvent(event: string, socket: net.Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once(event, (error?: any) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
