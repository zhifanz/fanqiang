export type Strict<T> = { [K in keyof T]: NonNullable<T[K]> };

export async function promiseAllSync<T, R>(values: T[], handler: (value: T) => Promise<R>): Promise<R[]> {
  const result: R[] = new Array(values.length);
  for (const v of values) {
    result.push(await handler(v));
  }
  return result;
}

export function singletonResult<T>(result: T[]): T {
  if (result.length !== 1) {
    throw new Error("Not singleton, actual length: " + result.length);
  }
  return result[0];
}

export function nonNullArray<T>(array: T[] | undefined): T[] {
  return array && array.length ? array : [];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitCondition(
  checkCondition: () => Promise<boolean>,
  interval?: number,
  maxRetries?: number
): Promise<void> {
  let remain = maxRetries || 10;
  const waitMillis = interval || 5000;
  while (remain > 0) {
    if (await checkCondition()) {
      return;
    }
    await sleep(waitMillis);
    remain -= 1;
  }
  throw new Error("Resource failed to reach status!");
}

export function executeWithEnvironment<R>(func: () => R, envKey: string, envValue: string): R {
  const oldValue = process.env[envKey];
  process.env[envKey] = envValue;
  try {
    return func();
  } finally {
    if (oldValue === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = oldValue;
    }
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
