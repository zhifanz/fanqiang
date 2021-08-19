import { waitCondition } from "../langUtils";

export async function waitOperation<T>(operation: () => Promise<T>, ignoredError: string): Promise<T> {
  let result: T;
  await waitCondition(async () => {
    try {
      result = await operation();
      return true;
    } catch (e) {
      if (e.name?.includes(ignoredError)) {
        return false;
      }
      throw e;
    }
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return result;
}

export async function willThrowError(call: () => Promise<void>, errorName: string): Promise<boolean> {
  try {
    await call();
    return false;
  } catch (aliyunError) {
    if (aliyunError.name?.includes(errorName)) {
      return true;
    }
    throw aliyunError;
  }
}
