export function safeSet<S>(
  set: (partial: Partial<S> | ((state: S) => Partial<S>)) => void,
  partial: Partial<S> | ((state: S) => Partial<S>),
  logLabel: string = 'store'
): void {
  try {
    set(partial);
  } catch (err) {
    console.error(`${logLabel}: set() failed`, err, { partial });
  }
}

export function safeGet<S, R>(
  get: () => S,
  fn: (s: S) => R,
  fallback: R,
  logLabel: string = 'store'
): R {
  try {
    return fn(get());
  } catch (err) {
    console.error(`${logLabel}: get() failed`, err);
    return fallback;
  }
}

export function offlineHint(): string {
  try {
    return typeof navigator !== 'undefined' &&
    'onLine' in navigator &&
    (navigator).onLine === false
      ? ' You appear to be offline.'
      : '';
  } catch {
    return '';
  }
}

export function storageWritable(s: Storage): boolean {
  try {
    const t = '__test__';
    s.setItem(t, '1');
    s.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

export function getStore(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (storageWritable(window.localStorage)) return window.localStorage;
    if (storageWritable(window.sessionStorage)) return window.sessionStorage;
  } catch {
  }
  return null;
}
