import net from "net";

export async function checkServiceAvailable(port: number, host: string, timeout: number): Promise<void> {
  const socket = net.connect({ port, host, family: 4, timeout });
  try {
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("timeout", () => reject("timeout"));
      socket.once("error", (err) => reject(err));
    });
  } finally {
    socket.destroy();
  }
}
