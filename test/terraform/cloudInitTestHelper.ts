import Terraform from "../../lib/core/Terraform";
import { getCredentialsProviders } from "../../lib/core/Credentials";
import * as fs from "fs-extra";
import path from "path";
import child_process from "child_process";
import * as os from "os";
import { waitServiceAvailable } from "../../lib/core/netUtils";
import { asEnvironmentVariables } from "../../lib/core/terraformUtils";

export async function runTerraformTest(
  configSource: string,
  callback: (terraform: Terraform) => Promise<void>
): Promise<void> {
  const terraform = await Terraform.createInstance(
    configSource,
    asEnvironmentVariables(await getCredentialsProviders())
  );
  try {
    await callback(terraform);
  } finally {
    await terraform.destroy();
  }
}

export class KeyPair {
  private static instance: KeyPair | undefined;

  constructor(public readonly keyPath: string) {}

  async publicKey(): Promise<string> {
    return fs.readFile(this.keyPath + ".pub", "utf8");
  }

  public static get(): KeyPair {
    if (!KeyPair.instance) {
      KeyPair.instance = new KeyPair(
        process.env.FANQIANG_TEST_KEY_PATH || path.join(os.homedir(), ".ssh", "id_ed25519")
      );
      if (!fs.pathExistsSync(KeyPair.instance.keyPath)) {
        throw new Error("Key pair path does not exists: " + KeyPair.instance.keyPath);
      }
    }
    return KeyPair.instance;
  }
}

export class RemoteInstanceAssertions {
  readonly remoteShell: RemoteShell;
  constructor(readonly keyPair: KeyPair, readonly username: string, readonly remoteIp: string) {
    this.remoteShell = new RemoteShell(this.keyPair.keyPath, this.username, this.remoteIp);
  }

  async assertPortOpen(port: number): Promise<void> {
    await waitServiceAvailable(port, this.remoteIp);
  }

  assertFileExists(filePath: string): Promise<void> {
    this.remoteShell.execute(`until [ -f ${filePath} ]; do sleep 1 ; done`);
    return Promise.resolve();
  }
}

class RemoteShell {
  constructor(private readonly keyPath: string, private readonly username: string, private readonly address: string) {}

  public execute(command: string): string {
    return child_process.execSync(
      `ssh -i ${this.keyPath} -o StrictHostKeyChecking=off ${this.username}@${this.address} \"${command}\"`,
      {
        encoding: "utf8",
        timeout: 30000,
      }
    );
  }
}
