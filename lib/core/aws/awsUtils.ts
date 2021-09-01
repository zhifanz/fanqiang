import { GetUserCommand, IAMClient } from "@aws-sdk/client-iam";

export const DEFAULT_REGION = "us-east-1";

let cachedAccountId: string | undefined;

export async function accountId(): Promise<string> {
  if (!cachedAccountId) {
    cachedAccountId = <string>(
      await invokeDestroyCapable(
        new IAMClient({ region: DEFAULT_REGION }),
        async (t) => (await t.send(new GetUserCommand({}))).User?.UserName
      )
    );
  }
  return cachedAccountId;
}

export function invokeDestroyCapable<T extends { destroy(): void }, R>(target: T, func: (target: T) => R): R {
  try {
    return func(target);
  } finally {
    target.destroy();
  }
}

export async function invokeIgnoreError(
  func: () => Promise<void>,
  ignoredError: string,
  message?: string
): Promise<void> {
  try {
    await func();
  } catch (e) {
    if (e.name === ignoredError) {
      console.log(message || e.message);
      return;
    }
    throw e;
  }
}
