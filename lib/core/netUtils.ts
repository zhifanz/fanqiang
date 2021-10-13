import net from "net";
import promiseRetry from "promise-retry";

export async function checkServiceAvailable(port: number, host: string): Promise<void> {
  const socket = net.connect({ port, host, family: 4 });
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

export async function waitServiceAvailable(port: number, host: string, retries = 10): Promise<void> {
  await promiseRetry(
    async (retry) => {
      try {
        await checkServiceAvailable(port, host);
      } catch (error) {
        console.log("Service is not ready, waiting...");
        retry(error);
      }
    },
    { retries }
  );
}
