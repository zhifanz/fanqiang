import child_process from "child_process";

export function executeInherit(command: string, args: string[], cwd: string, customEnv: Record<string, string> = {}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const p = child_process.spawn(command, args, { cwd, stdio: "inherit", env: {...process.env, ...customEnv}});
    p.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject("error code: " + code);
      }
    });
    p.on("error", reject);
  });
}

export function execute(command: string, args: string[], cwd: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    child_process.execFile(command, args, { cwd }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}
