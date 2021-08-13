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
