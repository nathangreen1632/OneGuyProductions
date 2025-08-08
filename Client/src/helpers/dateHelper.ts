/**
 * Checks if a given date (string or Date) is within the last 72 hours.
 * Returns false if the date is invalid.
 */
export function isWithin72Hours(createdAt: string | Date): boolean {
  try {
    const ts =
      createdAt instanceof Date
        ? createdAt.getTime()
        : new Date(createdAt).getTime();

    if (Number.isNaN(ts)) {
      console.warn(`⚠️ isWithin72Hours: Invalid date "${createdAt}"`);
      return false;
    }

    const diff = Date.now() - ts;
    // Ensure it's within the past 72 hours and not in the future
    return diff >= 0 && diff < 72 * 60 * 60 * 1000;
  } catch (err) {
    console.error('❌ isWithin72Hours: Error processing date', err);
    return false;
  }
}
