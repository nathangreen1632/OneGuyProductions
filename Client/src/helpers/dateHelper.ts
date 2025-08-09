export function isWithin72Hours(createdAt: string | Date): boolean {
  try {
    const ts: number =
      createdAt instanceof Date
        ? createdAt.getTime()
        : new Date(createdAt).getTime();

    if (Number.isNaN(ts)) {
      console.warn(`⚠️ isWithin72Hours: Invalid date "${createdAt}"`);
      return false;
    }

    const diff: number = Date.now() - ts;
    return diff >= 0 && diff < 72 * 60 * 60 * 1000;
  } catch (err: unknown) {
    console.error('❌ isWithin72Hours: Error processing date', err);
    return false;
  }
}
