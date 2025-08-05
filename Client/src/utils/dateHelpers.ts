/**
 * Checks if a given date string is within the last 72 hours.
 * Returns false if the date is invalid.
 */
export function isWithin72Hours(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    const created = date.getTime();

    if (isNaN(created)) {
      console.warn(`⚠️ isWithin72Hours: Invalid date string "${dateString}"`);
      return false;
    }

    const now = Date.now();
    const diff = now - created;

    return diff < 72 * 60 * 60 * 1000; // 72 hours in ms
  } catch (err) {
    console.error('❌ isWithin72Hours: Error processing date', err);
    return false;
  }
}
