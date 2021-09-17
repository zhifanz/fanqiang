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
